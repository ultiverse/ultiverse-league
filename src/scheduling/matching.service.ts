import { Injectable } from '@nestjs/common';

// Import edmonds-blossom using ESM syntax with proper type assertion.
type BlossomFunction = (
  edges: [number, number, number][],
  maximize: boolean,
) => number[];
import blossomImport from 'edmonds-blossom';
const blossom: BlossomFunction = blossomImport as BlossomFunction;

/**
 * Adapter over edmonds-blossom (maximum weight matching on integer edge weights).
 * Input: symmetric COST matrix (lower = better).
 * Strategy: convert to sparse edge list with integer WEIGHTS (higher = better),
 * then run blossom in MAX mode.
 */
@Injectable()
export class MatchingService {
  perfectMatching(costs: number[][]): number[] {
    const n = costs.length;
    if (n % 2 !== 0) throw new Error('Number of nodes must be even.');
    for (const row of costs)
      if (row.length !== n) throw new Error('Cost matrix must be square.');

    // Build sparse edge list (i<j) and find finite maxCost for normalization
    const edges: [number, number, number][] = [];
    let maxCost = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const c = costs[i][j];
        if (!Number.isFinite(c)) continue; // skip blocked/self edges
        edges.push([i, j, c]);
        if (c > maxCost) maxCost = c;
      }
    }
    if (!Number.isFinite(maxCost))
      throw new Error('No finite edges in cost graph.');

    // Convert cost -> weight (maximize): higher weight for lower cost.
    // Use positive integers as blossom expects integers; scale to preserve precision.
    const SCALE = 1e6;
    const weightedEdges: [number, number, number][] = edges.map(([i, j, c]) => {
      // e.g., weight = (maxCost - c) * SCALE  (so best/lowest cost gets highest weight)
      const w = Math.max(0, Math.round((maxCost - c) * SCALE));
      return [i, j, w];
    });

    // Some distributions expose different arities; the common one is blossom(edges, true)
    // where 'true' = maximize. If your local build needs (edges, n) or (edges, n, true),
    // uncomment the variant that matches. The below works for the widely used version.
    const mate: number[] = blossom(weightedEdges, true);

    // Verify perfect matching
    if (!Array.isArray(mate) || mate.length !== n) {
      throw new Error('Blossom did not return a valid mate array.');
    }
    for (let i = 0; i < n; i++) {
      if (mate[i] === -1 || mate[mate[i]] !== i) {
        throw new Error('No perfect matching found (node unmatched).');
      }
    }
    return mate;
  }
}
