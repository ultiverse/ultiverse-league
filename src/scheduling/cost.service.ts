import { Injectable } from '@nestjs/common';
import {
  CountMatrix,
  HistoryState,
  PodId,
  RoundIndexMatrix,
  SkillRatings,
} from './types';
import { hash2 } from './random.util';

export interface CostWeights {
  unseenPartnerWeight: number;
  repeatedPartnerPenalty: number;
  recentPartnerPenalty: number;
  skillBalanceWeight: number;
  jitter: number; // tiny value to break ties deterministically
}

@Injectable()
export class CostService {
  private defaultWeights: CostWeights = {
    unseenPartnerWeight: -20,
    repeatedPartnerPenalty: 4,
    recentPartnerPenalty: 12,
    skillBalanceWeight: 0.2,
    jitter: 0.001,
  };

  partnerCostMatrix(
    pods: PodId[],
    history: HistoryState | undefined,
    skill: SkillRatings | undefined,
    currentRoundIndex: number,
    recencyWindow = 2,
    weights: Partial<CostWeights> = {},
  ): number[][] {
    const w = { ...this.defaultWeights, ...weights };
    const pc: CountMatrix = history?.partneredCounts ?? {};
    const lr: RoundIndexMatrix = history?.lastPartneredRound ?? {};

    const n = pods.length;
    const C: number[][] = Array.from({ length: n }, () =>
      Array.from({ length: n }, () => 0),
    );

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          C[i][j] = 1e9;
          continue;
        }
        const A = pods[i],
          B = pods[j];

        const repeats = pc[A]?.[B] ?? 0;
        const last = lr[A]?.[B];
        const aSkill = skill?.[A];
        const bSkill = skill?.[B];

        let cost = 0;

        cost +=
          repeats === 0
            ? w.unseenPartnerWeight
            : repeats * w.repeatedPartnerPenalty;

        if (
          typeof last === 'number' &&
          currentRoundIndex - last <= recencyWindow
        ) {
          cost += w.recentPartnerPenalty;
        }

        if (aSkill !== undefined && bSkill !== undefined) {
          cost += Math.abs(aSkill - bSkill) * w.skillBalanceWeight;
        }

        // Deterministic jitter
        cost += (hash2(i, j) - 0.5) * w.jitter;

        C[i][j] = cost;
      }
    }
    // symmetry
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const s = (C[i][j] + C[j][i]) / 2;
        C[i][j] = C[j][i] = s;
      }
    return C;
  }

  pairVsPairCost(
    pairA: [PodId, PodId],
    pairB: [PodId, PodId],
    history: HistoryState | undefined,
    currentRoundIndex: number,
    recencyWindow = 2,
  ): number {
    const oc: CountMatrix = history?.opposedCounts ?? {};
    const lr: RoundIndexMatrix = history?.lastOpposedRound ?? {};

    const cross: [PodId, PodId][] = [
      [pairA[0], pairB[0]],
      [pairA[0], pairB[1]],
      [pairA[1], pairB[0]],
      [pairA[1], pairB[1]],
    ];

    let repeats = 0;
    let recentHits = 0;

    for (const [x, y] of cross) {
      repeats += oc[x]?.[y] ?? 0;
      const last = lr[x]?.[y];
      if (
        typeof last === 'number' &&
        currentRoundIndex - last <= recencyWindow
      ) {
        recentHits++;
      }
    }

    return repeats * 2 + recentHits * 4;
  }
}
