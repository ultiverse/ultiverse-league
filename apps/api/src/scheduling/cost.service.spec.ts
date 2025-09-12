/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';

// ---- Mock jitter source to keep tests deterministic ----
// (hash2(i,j) - 0.5) * jitter -> 0
jest.mock('./random.util', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hash2: jest.fn().mockImplementation((_i: number, _j: number) => 0.5),
}));

import { CostService, type CostWeights } from './cost.service';
import { BIG } from './scheduling.constants';

type PodId = string;

describe('CostService', () => {
  let service: CostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CostService],
    }).compile();

    service = module.get<CostService>(CostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('partnerCostMatrix', () => {
    const pods: PodId[] = ['A', 'B', 'C', 'D'];

    it('sets diagonal to BIG and matrix is symmetric', () => {
      const C = service.partnerCostMatrix(pods, undefined, undefined, 5);

      // Diagonal
      for (let i = 0; i < pods.length; i++) {
        expect(C[i][i]).toBe(BIG);
      }

      // Symmetry
      for (let i = 0; i < pods.length; i++) {
        for (let j = i + 1; j < pods.length; j++) {
          expect(C[i][j]).toBeCloseTo(C[j][i], 10);
        }
      }
    });

    it('applies unseenPartnerWeight when pods have never partnered', () => {
      // history empty -> repeats = 0, no recency penalty, no skills
      const C = service.partnerCostMatrix(['A', 'B'], undefined, undefined, 10);
      // With jitter neutralized, cost should equal unseenPartnerWeight (-20 by default)
      expect(C[0][1]).toBeCloseTo(-20);
      expect(C[1][0]).toBeCloseTo(-20);
    });

    it('applies repeatedPartnerPenalty when repeats > 0 (no unseen weight)', () => {
      const history = {
        partneredCounts: { A: { B: 2 }, B: { A: 2 } }, // 2 repeats
        lastPartneredRound: {}, // no recency penalty
      } as any;

      const C = service.partnerCostMatrix(['A', 'B'], history, undefined, 10);
      // repeats * repeatedPartnerPenalty = 2 * 4 = 8
      expect(C[0][1]).toBeCloseTo(8);
      expect(C[1][0]).toBeCloseTo(8);
    });

    it('adds recentPartnerPenalty when last partner is within recencyWindow', () => {
      // repeats=0 (so unseen -20) + recent penalty (12) = -8
      const history = {
        partneredCounts: { A: { B: 0 }, B: { A: 0 } },
        lastPartneredRound: { A: { B: 9 }, B: { A: 9 } },
      } as any;

      const currentRound = 10; // distance = 1
      const C = service.partnerCostMatrix(
        ['A', 'B'],
        history,
        undefined,
        currentRound,
        2,
      );
      expect(C[0][1]).toBeCloseTo(-8);
      expect(C[1][0]).toBeCloseTo(-8);
    });

    it('counts recency when exactly on the window boundary', () => {
      // last = currentRound - recencyWindow should still count
      const history = {
        partneredCounts: { A: { B: 0 }, B: { A: 0 } },
        lastPartneredRound: { A: { B: 8 }, B: { A: 8 } },
      } as any;

      const currentRound = 10;
      const recencyWindow = 2; // distance = 2 -> counts
      const C = service.partnerCostMatrix(
        ['A', 'B'],
        history,
        undefined,
        currentRound,
        recencyWindow,
      );
      // unseen -20 + recent 12 = -8
      expect(C[0][1]).toBeCloseTo(-8);
    });

    it('adds skill-balance cost when skill ratings are provided', () => {
      // unseen (-20) + |10 - 7| * 0.2 = -20 + 0.6 = -19.4
      const skills = { A: 10, B: 7 } as any;
      const history = {
        partneredCounts: { A: { B: 0 }, B: { A: 0 } },
        lastPartneredRound: {},
      } as any;

      const C = service.partnerCostMatrix(['A', 'B'], history, skills, 5);
      expect(C[0][1]).toBeCloseTo(-19.4, 6);
      expect(C[1][0]).toBeCloseTo(-19.4, 6);
    });

    it('respects custom weights passed to the method', () => {
      const custom: Partial<CostWeights> = {
        unseenPartnerWeight: -5,
        repeatedPartnerPenalty: 10,
        recentPartnerPenalty: 1,
        skillBalanceWeight: 2,
        jitter: 0.123, // still neutralized by mocked hash2 (becomes 0)
      };

      const history = {
        partneredCounts: { A: { B: 1 }, B: { A: 1 } }, // repeats = 1
        lastPartneredRound: { A: { B: 4 }, B: { A: 4 } }, // currentRound=5 -> recent by 1
      } as any;

      const skills = { A: 10, B: 7 } as any;

      // cost = repeats*10 + recent(1) + |10-7|*2 = 1*10 + 1 + 6 = 17
      const C = service.partnerCostMatrix(
        ['A', 'B'],
        history,
        skills,
        5,
        2,
        custom,
      );
      expect(C[0][1]).toBeCloseTo(17);
      expect(C[1][0]).toBeCloseTo(17);
    });

    it('handles larger matrices and remains symmetric with mixed factors', () => {
      const pods = ['A', 'B', 'C', 'D'];
      const history = {
        partneredCounts: {
          A: { B: 1 }, // A-B repeated once
          B: { A: 1 },
          C: { D: 0 },
          D: { C: 0 },
        },
        lastPartneredRound: {
          A: { B: 7 }, // recent if currentRound=8, window=2
          B: { A: 7 },
        },
      } as any;

      const skills = { A: 6, B: 6, C: 1, D: 9 } as any; // C-D unbalanced (|1-9|=8)

      const C = service.partnerCostMatrix(pods, history, skills, 8, 2);

      // Symmetry spot checks
      expect(C[0][1]).toBeCloseTo(C[1][0], 10);
      expect(C[2][3]).toBeCloseTo(C[3][2], 10);

      // A-B: repeats=1 -> 4; recent -> +12; skills equal -> +0; unseen not applied
      // => ~16
      expect(C[0][1]).toBeCloseTo(16);

      // C-D: repeats=0 -> unseen (-20); not recent; skill diff 8 * 0.2 = 1.6
      // => -18.4
      expect(C[2][3]).toBeCloseTo(-18.4, 6);
    });
  });

  describe('pairVsPairCost', () => {
    it('returns 0 when there is no history', () => {
      const cost = service.pairVsPairCost(
        ['A', 'B'],
        ['C', 'D'],
        undefined,
        10,
        2,
      );
      expect(cost).toBe(0);
    });

    it('sums repeats across cross-pairs with weight 2 per repeat', () => {
      const history = {
        opposedCounts: {
          A: { C: 1, D: 0 },
          B: { C: 2, D: 0 },
        },
        lastOpposedRound: {},
      } as any;

      // repeats = 1 + 0 + 2 + 0 = 3 -> 3 * 2 = 6
      const cost = service.pairVsPairCost(
        ['A', 'B'],
        ['C', 'D'],
        history,
        15,
        2,
      );
      expect(cost).toBe(6);
    });

    it('adds recent hits (within window) with weight 4 each', () => {
      const currentRound = 12;
      const recencyWindow = 2;

      const history = {
        opposedCounts: {
          A: { C: 1, D: 0 },
          B: { C: 0, D: 0 },
        },
        lastOpposedRound: {
          A: { C: 11 }, // distance 1 -> recent
          B: { D: 10 }, // distance 2 -> on boundary -> recent
        },
      } as any;

      // repeats = 1; recentHits = 2 -> cost = 1*2 + 2*4 = 2 + 8 = 10
      const cost = service.pairVsPairCost(
        ['A', 'B'],
        ['C', 'D'],
        history,
        currentRound,
        recencyWindow,
      );
      expect(cost).toBe(10);
    });

    it('combines repeats and recent across all four cross-edges', () => {
      const currentRound = 20;
      const recencyWindow = 3;

      const history = {
        opposedCounts: {
          A: { C: 2, D: 1 },
          B: { C: 0, D: 3 },
        },
        lastOpposedRound: {
          A: { C: 18, D: 16 }, // distances 2 (recent), 4 (not recent)
          B: { C: 17, D: 19 }, // distances 3 (recent), 1 (recent)
        },
      } as any;

      // repeats = 2 + 1 + 0 + 3 = 6 -> 6 * 2 = 12
      // recent: A-C (2), B-C (3), B-D (1) -> 3 recents -> 3 * 4 = 12
      // total = 24
      const cost = service.pairVsPairCost(
        ['A', 'B'],
        ['C', 'D'],
        history,
        currentRound,
        recencyWindow,
      );
      expect(cost).toBe(24);
    });
  });
});
