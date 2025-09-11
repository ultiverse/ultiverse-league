import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('PodScheduler (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('generates blocks with no overlaps (8 pods → 2 blocks per round)', async () => {
    const res = await request(app.getHttpServer())
      .post('/schedule/pods')
      .send({ podIds: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], rounds: 1 })
      .expect(201);

    const out = res.body as {
      rounds: {
        games: { home: { pods: string[] }; away: { pods: string[] } }[];
      }[];
    };
    expect(out.rounds[0].games).toHaveLength(2);
    for (const g of out.rounds[0].games) {
      expect(g.home.pods).toHaveLength(2);
      expect(g.away.pods).toHaveLength(2);
    }
  });

  it('prefers unseen partners on first round', async () => {
    const podIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    // Simulate recent partner history (these should be avoided if possible)
    // A-B, C-D, E-F, G-H were partners recently (round 0)
    const history = {
      partneredCounts: {
        A: { B: 1 },
        B: { A: 1 },
        C: { D: 1 },
        D: { C: 1 },
        E: { F: 1 },
        F: { E: 1 },
        G: { H: 1 },
        H: { G: 1 },
      },
      lastPartneredRound: {
        A: { B: 0 },
        B: { A: 0 },
        C: { D: 0 },
        D: { C: 0 },
        E: { F: 0 },
        F: { E: 0 },
        G: { H: 0 },
        H: { G: 0 },
      },
    };

    const res = await request(app.getHttpServer())
      .post('/schedule/pods')
      .send({
        podIds,
        rounds: 1,
        recencyWindow: 2, // make “recent” matter
        history, // feed the recent partners
        pairingMode: 'each-vs-both',
      })
      .expect(201);

    type Game = { home: { pods: string[] }; away: { pods: string[] } };
    const out = res.body as { rounds: { games: Game[] }[] };
    expect(out.rounds).toHaveLength(1);
    const games = out.rounds[0].games;
    expect(games.length).toBe(2); // 8 pods -> 2 games (each with two pods per side)

    // Build a quick lookup of first-round partner pairs
    const partnerPairs = new Set<string>();
    const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

    for (const g of games) {
      expect(g.home.pods).toHaveLength(2);
      expect(g.away.pods).toHaveLength(2);
      partnerPairs.add(key(g.home.pods[0], g.home.pods[1]));
      partnerPairs.add(key(g.away.pods[0], g.away.pods[1]));
    }

    // Assert none of the “recent” partners were re-used in round 1
    const recentlyPartnered = [
      key('A', 'B'),
      key('C', 'D'),
      key('E', 'F'),
      key('G', 'H'),
    ];

    for (const p of recentlyPartnered) {
      expect(partnerPairs.has(p)).toBe(false);
    }
  });
});
