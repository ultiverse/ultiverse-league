/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { PodSchedulerService } from './pod-scheduler.service';
import { BIG } from './scheduling.constants';

// --- Mock collaborators ---
const matchingMock = { perfectMatching: jest.fn() };
const costsMock = {
  partnerCostMatrix: jest.fn(),
  pairVsPairCost: jest.fn(),
};

// history utils are free functions; mock for call assertions
const cloneHistoryMock = jest.fn((h: any) =>
  h ? JSON.parse(JSON.stringify(h)) : {},
);
const applyRoundToHistoryMock = jest.fn();

jest.mock('./history.util', () => ({
  cloneHistory: (h: any) => cloneHistoryMock(h),
  applyRoundToHistory: (...args: any[]) => applyRoundToHistoryMock(...args),
}));

// Provide fake classes that Nest can inject
class MatchingServiceMock {
  perfectMatching = (...args: any[]) => matchingMock.perfectMatching(...args);
}
class CostServiceMock {
  partnerCostMatrix = (...args: any[]) => costsMock.partnerCostMatrix(...args);
  pairVsPairCost = (...args: any[]) => costsMock.pairVsPairCost(...args);
}

describe('PodSchedulerService', () => {
  let service: PodSchedulerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PodSchedulerService,
        { provide: 'MatchingService', useClass: MatchingServiceMock },
        { provide: 'CostService', useClass: CostServiceMock },
      ],
    })
      // map tokens to actual classes expected by constructor
      .useMocker((token) => {
        if (
          token &&
          typeof token === 'function' &&
          token.name === 'MatchingService'
        ) {
          return new MatchingServiceMock();
        }
        if (
          token &&
          typeof token === 'function' &&
          token.name === 'CostService'
        ) {
          return new CostServiceMock();
        }
      })
      .compile();

    service = module.get<PodSchedulerService>(PodSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('throws when pods are not a multiple of 4', () => {
    expect(() =>
      service.build({
        pods: ['A', 'B', 'C', 'D', 'E', 'F'], // 6 pods
        rounds: 1,
      }),
    ).toThrow('Number of pods must be a multiple of 4.');
  });

  it('builds one round with one block and correct teams', () => {
    const pods = ['A', 'B', 'C', 'D'] as const;

    // partner cost matrix arbitrary shape to satisfy call
    costsMock.partnerCostMatrix.mockReturnValueOnce([
      [BIG, 1, 2, 3],
      [1, BIG, 4, 5],
      [2, 4, BIG, 6],
      [3, 5, 6, BIG],
    ]);

    // First perfectMatching: pair partners -> (0,1) and (2,3)
    // mate array must be mutual: [1,0,3,2]
    // Second perfectMatching (pairs): with 2 pairs, mate [1,0] yields one block
    matchingMock.perfectMatching
      .mockReturnValueOnce([1, 0, 3, 2]) // partner matching
      .mockReturnValueOnce([1, 0]); // pair-vs-pair matching

    // Make pairVsPairCost symmetric-averaging check easier:
    // Return asymmetric values so we can assert scheduler averaged them later.
    // (Pairs derived from mate: [A,B] index 0, [C,D] index 1)
    costsMock.pairVsPairCost.mockImplementation((pairA, pairB) => {
      const key = `${pairA.join('')}-${pairB.join('')}`;
      if (key === 'AB-CD') return 10; // i=0,j=1
      if (key === 'CD-AB') return 30; // i=1,j=0
      if (pairA[0] === pairB[0] && pairA[1] === pairB[1]) return 999999; // shouldn't be called for i===j
      return 0;
    });

    const out = service.build({ pods: [...pods], rounds: 1 });
    expect(out.rounds).toHaveLength(1);
    expect(out.rounds[0].round).toBe(1);
    expect(out.rounds[0].blocks).toEqual([{ a: 'A', b: 'B', c: 'C', d: 'D' }]);

    // cloneHistory called with the input history (undefined here still called once returning {})
    expect(cloneHistoryMock).toHaveBeenCalledTimes(1);

    // applyRoundToHistory called once with blocks and rAbs=0 (default baseRoundIndex)
    expect(applyRoundToHistoryMock).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [histArg, blocksArg, rAbsArg] = applyRoundToHistoryMock.mock.calls[0];
    expect(blocksArg).toEqual([{ a: 'A', b: 'B', c: 'C', d: 'D' }]);
    expect(rAbsArg).toBe(0);

    // partnerCostMatrix called with correct propagation of args
    const [podsArg, histW, skillArg, rAbsPartner, recencyWindow] =
      costsMock.partnerCostMatrix.mock.calls[0];
    expect(podsArg).toEqual(pods);
    expect(histW).toEqual({}); // clone of undefined -> {}
    expect(skillArg).toBeUndefined();
    expect(rAbsPartner).toBe(0);
    expect(recencyWindow).toBe(2); // default

    // Check that pair cost diagonal became BIG and matrix was symmetrized to avg(10,30)=20
    // We capture the second call into perfectMatching (pairCosts passed to matching)
    const pairCostsPassed = matchingMock.perfectMatching.mock
      .calls[1][0] as number[][];
    expect(pairCostsPassed.length).toBe(2);
    // Diagonal is BIG
    expect(pairCostsPassed[0][0]).toBe(BIG);
    expect(pairCostsPassed[1][1]).toBe(BIG);
    // Off-diagonal both directions equal after averaging
    expect(pairCostsPassed[0][1]).toBe(20);
    expect(pairCostsPassed[1][0]).toBe(20);

    // pairVsPairCost was called for (0,1) and (1,0) twice (due to double loop in code)
    // We don't rely on exact count, but ensure both directions were requested at least once
    const keys = costsMock.pairVsPairCost.mock.calls.map(
      ([pa, pb]: any[]) => `${pa.join('')}-${pb.join('')}`,
    );
    expect(keys).toContain('AB-CD');
    expect(keys).toContain('CD-AB');
  });

  it('propagates custom recencyWindow and baseRoundIndex and updates per round', () => {
    const pods = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    // Make 4 pairs from 8 pods: (0,1),(2,3),(4,5),(6,7)
    matchingMock.perfectMatching
      .mockReturnValueOnce([1, 0, 3, 2, 5, 4, 7, 6]) // round 1 - partner matching
      .mockReturnValueOnce([1, 0, 3, 2]) // round 1 - pair matching (4 pairs -> 2 blocks)
      .mockReturnValueOnce([1, 0, 3, 2, 5, 4, 7, 6]) // round 2 - partner matching
      .mockReturnValueOnce([1, 0, 3, 2]); // round 2 - pair matching

    // partnerCostMatrix dummy return (shape only matters)
    costsMock.partnerCostMatrix.mockImplementation((podsArg: any[]) =>
      Array.from({ length: podsArg.length }, (_, i) =>
        Array.from({ length: podsArg.length }, (_, j) => (i === j ? BIG : 0)),
      ),
    );

    // pairVsPairCost arbitrary constant
    costsMock.pairVsPairCost.mockReturnValue(0);

    const out = service.build({
      pods,
      rounds: 2,
      recencyWindow: 5,
      baseRoundIndex: 10,
      history: { partneredCounts: {}, opposedCounts: {} } as any,
    });

    expect(out.rounds).toHaveLength(2);
    // Round labels start at 1 within this build
    expect(out.rounds[0].round).toBe(1);
    expect(out.rounds[1].round).toBe(2);

    // partnerCostMatrix called twice, with rAbs 10 then 11, and recencyWindow=5
    const calls = costsMock.partnerCostMatrix.mock.calls;
    expect(calls[0][3]).toBe(10); // rAbs for first round
    expect(calls[1][3]).toBe(11); // rAbs for second round
    expect(calls[0][4]).toBe(5);
    expect(calls[1][4]).toBe(5);

    // applyRoundToHistory called after each round with rAbs 10 then 11
    expect(applyRoundToHistoryMock).toHaveBeenCalledTimes(2);
    expect(applyRoundToHistoryMock.mock.calls[0][2]).toBe(10);
    expect(applyRoundToHistoryMock.mock.calls[1][2]).toBe(11);

    // cloneHistory called once with provided history
    expect(cloneHistoryMock).toHaveBeenCalledTimes(1);
    expect(cloneHistoryMock.mock.calls[0][0]).toEqual({
      partneredCounts: {},
      opposedCounts: {},
    });
  });
});
