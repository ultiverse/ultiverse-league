import { Injectable } from '@nestjs/common';
import {
  CountMatrix,
  HistoryState,
  PodId,
  RoundIndexMatrix,
  SkillRatings,
} from './types';
import { BIG } from './scheduling.constants';

/**
 * Cost function weights. Lower cost = more desirable.
 */
export interface CostWeights {
  unseenPartnerWeight: number; // reward unseen partnerings (negative cost)
  repeatedPartnerPenalty: number; // penalty per repeat partnering
  recentPartnerPenalty: number; // penalty if within recency window
  skillBalanceWeight: number; // weight * |skill(a)-skill(b)|
}

@Injectable()
export class CostService {
  private defaultWeights: CostWeights = {
    unseenPartnerWeight: -5,
    repeatedPartnerPenalty: 2,
    recentPartnerPenalty: 3,
    skillBalanceWeight: 0.2,
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
      new Array<number>(n).fill(0),
    );

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          C[i][j] = BIG;
          continue;
        }
        const A = pods[i],
          B = pods[j];

        const repeats = pc[A]?.[B] ?? 0;
        const last = lr[A]?.[B];
        const aSkill = skill?.[A] ?? undefined;
        const bSkill = skill?.[B] ?? undefined;

        let cost = 0;

        // Prefer unseen partners (give negative cost)
        if (repeats === 0) {
          cost += w.unseenPartnerWeight;
        } else {
          cost += repeats * w.repeatedPartnerPenalty;
        }

        // Recency penalty (if they partnered recently)
        if (
          typeof last === 'number' &&
          currentRoundIndex - last <= recencyWindow
        ) {
          cost += w.recentPartnerPenalty;
        }

        // Optional skill balancing: minimize |diff|
        if (aSkill !== undefined && bSkill !== undefined) {
          cost += Math.abs(aSkill - bSkill) * w.skillBalanceWeight;
        }

        C[i][j] = cost;
      }
    }
    // Blossom expects symmetric costs; ensure symmetry
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) {
        const s = (C[i][j] + C[j][i]) / 2;
        C[i][j] = C[j][i] = s;
      }
    return C;
  }

  // Pair-vs-pair cost (for opponent stage). We’ll use pod-level opposed counts as a proxy.
  pairVsPairCost(
    pairA: [PodId, PodId],
    pairB: [PodId, PodId],
    history: HistoryState | undefined,
    currentRoundIndex: number,
    recencyWindow = 2,
  ): number {
    const oc: CountMatrix = history?.opposedCounts ?? {};
    const lr: RoundIndexMatrix = history?.lastOpposedRound ?? {};

    const podsCross = [
      [pairA[0], pairB[0]],
      [pairA[0], pairB[1]],
      [pairA[1], pairB[0]],
      [pairA[1], pairB[1]],
    ];

    let repeats = 0;
    let recentHits = 0;

    for (const [x, y] of podsCross) {
      repeats += oc[x]?.[y] ?? 0;
      const last = lr[x]?.[y];
      if (typeof last === 'number' && currentRoundIndex - last <= recencyWindow)
        recentHits++;
    }

    // Basic scheme: prefer unseen pair-vs-pair (low cost),
    // penalize repeats and recency.
    return repeats * 2 + recentHits * 2;
  }
}
