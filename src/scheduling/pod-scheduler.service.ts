import { Injectable } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { CostService } from './cost.service';
import {
  GameBlock,
  PodId,
  RoundBlocks,
  ScheduleInput,
  ScheduleOutput,
} from './types';
import { BIG } from './scheduling.constants';

@Injectable()
export class PodSchedulerService {
  constructor(
    private readonly matching: MatchingService,
    private readonly costs: CostService,
  ) {}

  build(input: ScheduleInput): ScheduleOutput {
    const pods = [...input.pods];
    if (pods.length % 4 !== 0) {
      throw new Error(
        'Number of pods must be a multiple of 4 (to form A&B vs C&D blocks).',
      );
    }

    const recencyWindow = input.recencyWindow ?? 2;
    const rounds: RoundBlocks[] = [];

    // Current round index is 0-based within this call.
    for (let r = 0; r < input.rounds; r++) {
      // 1) Partner matching: min-cost perfect matching across pods.
      const partnerCosts = this.costs.partnerCostMatrix(
        pods,
        input.history,
        input.skill,
        r,
        recencyWindow,
      );

      // Depending on your blossom build, you may need invert=true for min-cost.
      // We’ll default to invert=false, and confirm with tests.
      const mate = this.matching.perfectMatching(partnerCosts);

      // Convert mate[] to list of unique pairs
      const used = new Set<number>();
      const pairs: [PodId, PodId][] = [];
      for (let i = 0; i < mate.length; i++) {
        const j = mate[i];
        if (i < j && !used.has(i) && !used.has(j)) {
          pairs.push([pods[i], pods[j]]);
          used.add(i);
          used.add(j);
        }
      }

      // 2) Opponent matching: group pairs into blocks of 2 pairs (4 pods total).
      // We’ll create a cost matrix over pairs and run Blossom again.
      if (pairs.length % 2 !== 0) {
        throw new Error('Internal: pairs length must be even.');
      }
      const m = pairs.length;
      const pairCosts: number[][] = Array.from({ length: m }, (): number[] =>
        new Array<number>(m).fill(0),
      );
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
          if (i === j) {
            pairCosts[i][j] = BIG;
            continue;
          }
          pairCosts[i][j] = this.costs.pairVsPairCost(
            pairs[i],
            pairs[j],
            input.history,
            r,
            recencyWindow,
          );
        }
      }
      for (let i = 0; i < m; i++)
        for (let j = i + 1; j < m; j++) {
          const s = (pairCosts[i][j] + pairCosts[j][i]) / 2;
          pairCosts[i][j] = pairCosts[j][i] = s;
        }

      const pairMate = this.matching.perfectMatching(pairCosts);

      const seen = new Set<number>();
      const blocks: GameBlock[] = [];
      for (let i = 0; i < pairMate.length; i++) {
        const j = pairMate[i];
        if (i < j && !seen.has(i) && !seen.has(j)) {
          const [a, b] = pairs[i];
          const [c, d] = pairs[j];
          blocks.push({ a, b, c, d });
          seen.add(i);
          seen.add(j);
        }
      }

      rounds.push({ round: r + 1, blocks });
      // NOTE: Not mutating history here; caller can capture the schedule and update persistent history matrices after committing.
    }

    return { rounds };
  }
}
