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
import { cloneHistory, applyRoundToHistory } from './history.util';

@Injectable()
export class PodSchedulerService {
  constructor(
    private readonly matching: MatchingService,
    private readonly costs: CostService,
  ) {}

  build(input: ScheduleInput): ScheduleOutput {
    const pods = [...input.pods];
    if (pods.length % 4 !== 0) {
      throw new Error('Number of pods must be a multiple of 4.');
    }
    const recencyWindow = input.recencyWindow ?? 2;

    // ✅ working history so each round sees the previous rounds’ results
    const workingHistory = cloneHistory(input.history);

    const rounds: RoundBlocks[] = [];
    // We use an absolute round index that increments within this build call
    let rAbs = input.baseRoundIndex ?? 0;

    for (let r = 0; r < input.rounds; r++, rAbs++) {
      // Partner matching
      const partnerCosts = this.costs.partnerCostMatrix(
        pods,
        workingHistory,
        input.skill,
        rAbs,
        recencyWindow,
      );
      const mate = this.matching.perfectMatching(partnerCosts);

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
      if (pairs.length % 2 !== 0)
        throw new Error('Internal: pairs length must be even.');

      // Opponent matching (pair vs pair)
      const m = pairs.length;
      const pairCosts: number[][] = Array.from({ length: m }, () =>
        Array<number>(m).fill(0),
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
            workingHistory,
            rAbs,
            recencyWindow,
          );
        }
      }
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < m; j++) {
          if (i === j) {
            pairCosts[i][j] = BIG;
            continue;
          }
          pairCosts[i][j] = this.costs.pairVsPairCost(
            pairs[i],
            pairs[j],
            workingHistory,
            rAbs,
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

      // ✅ update history so the next round penalizes repeats and recency
      applyRoundToHistory(workingHistory, blocks, rAbs);
    }

    return { rounds };
  }
}
