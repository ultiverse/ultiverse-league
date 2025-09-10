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
      .post('/schedule/real')
      .send({ pods: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], rounds: 1 })
      .expect(201);

    const out = res.body as {
      rounds: { blocks: { a: string; b: string; c: string; d: string }[] }[];
    };
    expect(out.rounds).toHaveLength(1);
    const blocks = out.rounds[0].blocks;
    expect(blocks).toHaveLength(2);

    const allPods = blocks.flatMap((b) => [b.a, b.b, b.c, b.d]);
    expect(new Set(allPods).size).toBe(8);
  });

  it('prefers unseen partners on first round', async () => {
    // Preload history that says A-B already partnered; unseen combos should be preferred
    const history = {
      partneredCounts: { A: { B: 1 }, B: { A: 1 } },
      lastPartneredRound: { A: { B: 0 }, B: { A: 0 } },
    };

    const res = await request(app.getHttpServer())
      .post('/schedule/real')
      .send({
        pods: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        rounds: 1,
        history,
        recencyWindow: 2,
      })
      .expect(201);

    const out = res.body as {
      rounds: { blocks: { a: string; b: string; c: string; d: string }[] }[];
    };
    const b = out.rounds[0].blocks;
    // A and B should *likely* not be partnered again on round 1
    const abPartnered = b.some(
      (blk: { a: string; b: string; c: string; d: string }) =>
        (blk.a === 'A' && blk.b === 'B') || (blk.a === 'B' && blk.b === 'A'),
    );
    expect(abPartnered).toBe(false);
  });
});
