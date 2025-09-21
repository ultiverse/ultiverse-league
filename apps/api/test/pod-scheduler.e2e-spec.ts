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

  it('generates valid pairings with recency window setting', async () => {
    const podIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    const res = await request(app.getHttpServer())
      .post('/schedule/pods')
      .send({
        podIds,
        rounds: 1,
        recencyWindow: 2,
        pairingMode: 'each-vs-both',
      })
      .expect(201);

    type Game = { home: { pods: string[] }; away: { pods: string[] } };
    const out = res.body as { rounds: { games: Game[] }[] };
    expect(out.rounds).toHaveLength(1);
    const games = out.rounds[0].games;
    expect(games.length).toBe(2); // 8 pods -> 2 games (each with two pods per side)

    // Verify game structure
    for (const g of games) {
      expect(g.home.pods).toHaveLength(2);
      expect(g.away.pods).toHaveLength(2);
    }

    // Verify all pods are used exactly once
    const usedPods = new Set<string>();
    for (const g of games) {
      for (const pod of g.home.pods) {
        expect(usedPods.has(pod)).toBe(false); // No pod used twice
        usedPods.add(pod);
      }
      for (const pod of g.away.pods) {
        expect(usedPods.has(pod)).toBe(false); // No pod used twice
        usedPods.add(pod);
      }
    }
    expect(usedPods.size).toBe(8); // All pods used
  });
});
