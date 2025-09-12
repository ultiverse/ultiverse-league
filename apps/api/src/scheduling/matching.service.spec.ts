/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';

// ---- Mock edmonds-blossom BEFORE importing the service ----
const blossomMock = jest.fn();
jest.mock('edmonds-blossom', () => ({
  __esModule: true,
  default: (...args: any[]) => blossomMock(...args),
}));

import { MatchingService } from './matching.service';

const INF = Number.POSITIVE_INFINITY;

describe('MatchingService', () => {
  let service: MatchingService;

  beforeEach(async () => {
    blossomMock.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchingService],
    }).compile();

    service = module.get<MatchingService>(MatchingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('computes integer weights from costs and returns a valid mate array', () => {
    const costs = [
      [INF, 1, 100, 100],
      [1, INF, 100, 100],
      [100, 100, INF, 1],
      [100, 100, 1, INF],
    ];

    // Return a valid perfect matching for n=4
    blossomMock.mockImplementationOnce(() => [1, 0, 3, 2]);

    const mate = service.perfectMatching(costs);
    expect(mate).toEqual([1, 0, 3, 2]);

    // Verify blossom was called with expected weighted edges + maximize=true
    expect(blossomMock).toHaveBeenCalledTimes(1);
    const [weightedEdges, maximize] = blossomMock.mock.calls[0];
    expect(maximize).toBe(true);

    // maxCost = 100, SCALE = 1e6 → weight = round((100 - c) * 1e6)
    const W = (c: number) => Math.max(0, Math.round((100 - c) * 1e6));
    expect(weightedEdges).toEqual([
      [0, 1, W(1)],
      [0, 2, W(100)],
      [0, 3, W(100)],
      [1, 2, W(100)],
      [1, 3, W(100)],
      [2, 3, W(1)],
    ]);
  });

  it('skips Infinity (blocked) edges when constructing the graph', () => {
    const costs = [
      [INF, 5, INF, 7],
      [5, INF, 9, 11],
      [INF, 9, INF, 13],
      [7, 11, 13, INF],
    ];

    blossomMock.mockImplementationOnce(() => [1, 0, 3, 2]);

    service.perfectMatching(costs);

    const [weightedEdges] = blossomMock.mock.calls[0];
    // Ensure no edge [0,2] appears (cost was INF at [0][2])
    const hasBlockedEdge = weightedEdges.some(
      (e: [number, number, number]) =>
        (e[0] === 0 && e[1] === 2) || (e[0] === 2 && e[1] === 0),
    );
    expect(hasBlockedEdge).toBe(false);
  });

  it('throws if number of nodes is odd', () => {
    const costs = [
      [INF, 1, 2],
      [1, INF, 3],
      [2, 3, INF],
    ];
    expect(() => service.perfectMatching(costs)).toThrow(
      'Number of nodes must be even.',
    );
    expect(blossomMock).not.toHaveBeenCalled();
  });

  it('throws if the cost matrix is not square', () => {
    // Use even n=4 so we pass the "even" check; make one row ragged to trigger "square" check.
    const costs = [
      [INF, 1, 2, 3],
      [1, INF, 4, 5],
      [2, 4, INF], // <-- ragged row (length 3)
      [3, 5, 6, INF],
    ] as unknown as number[][]; // keep TS happy for the ragged row

    expect(() => service.perfectMatching(costs)).toThrow(
      'Cost matrix must be square.',
    );
    expect(blossomMock).not.toHaveBeenCalled();
  });

  it('throws if there are no finite edges at all', () => {
    const costs = [
      [INF, INF, INF, INF],
      [INF, INF, INF, INF],
      [INF, INF, INF, INF],
      [INF, INF, INF, INF],
    ];

    expect(() => service.perfectMatching(costs)).toThrow(
      'No finite edges in cost graph.',
    );
    expect(blossomMock).not.toHaveBeenCalled();
  });

  it('throws if blossom returns an array of the wrong length', () => {
    const costs = [
      [INF, 1, 2, 3],
      [1, INF, 4, 5],
      [2, 4, INF, 6],
      [3, 5, 6, INF],
    ];

    blossomMock.mockReturnValueOnce([1, 0]); // wrong length

    expect(() => service.perfectMatching(costs)).toThrow(
      'Blossom did not return a valid mate array.',
    );
  });

  it('throws if any node is unmatched (-1) or pairing is not mutual', () => {
    const costs = [
      [INF, 1, 2, 3],
      [1, INF, 4, 5],
      [2, 4, INF, 6],
      [3, 5, 6, INF],
    ];

    // Case 1: Unmatched node present
    blossomMock.mockReturnValueOnce([-1, 0, 3, 2]);
    expect(() => service.perfectMatching(costs)).toThrow(
      'No perfect matching found (node unmatched).',
    );

    // Case 2: Not mutual (mate[mate[i]] !== i)
    blossomMock.mockReturnValueOnce([1, 2, 0, 3]);
    expect(() => service.perfectMatching(costs)).toThrow(
      'No perfect matching found (node unmatched).',
    );
  });
});
