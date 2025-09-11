import { ScheduleView } from './types';

export interface VerifyOptions {
  recencyWindow: number; // e.g., 2
  checkFairness?: boolean; // default false
  maxFairnessSpread?: number; // default 1 (only used if checkFairness)
  maxEarlyOppRepeats: number; // e.g., 4
  maxEarlyPartnerRepeats: number; // e.g., 0
  maxRecencyViolations: number; // e.g., 0
}

export type ViolationType =
  | 'partner-repeat-too-early'
  | 'partner-recency'
  | 'opponent-repeat-too-early'
  | 'opponent-recency'
  | 'fairness-spread';

export interface Violation {
  type: ViolationType;
  round?: number;
  pair?: [string, string];
  ago?: number;
  spread?: number;
  max?: number;
  min?: number;
}

export interface VerifyResult {
  violations: Violation[];
  fairness: { max: number; min: number; spread: number };
  N: number;
  maxOpponentNoRepeatRounds: number;
  maxPartnerNoRepeatRounds: number;
  countsByType: Record<ViolationType, number>;
  pass: boolean;
}

export function verifyScheduleView(
  schedule: ScheduleView,
  opts: VerifyOptions,
): VerifyResult {
  const { recencyWindow } = opts;
  const rounds = schedule.rounds ?? [];

  // Collect pods
  const podSet = new Set<string>();
  for (const r of rounds) {
    for (const g of r.games ?? []) {
      for (const p of g.home.pods) podSet.add(p);
      for (const p of g.away.pods) podSet.add(p);
    }
  }
  const pods = Array.from(podSet);
  const N = pods.length;

  // Tallies
  const partnerCount = new Map<string, Map<string, number>>();
  const opponentCount = new Map<string, Map<string, number>>();
  const partnerLast = new Map<string, Map<string, number>>();
  const opponentLast = new Map<string, Map<string, number>>();
  const gameCount = new Map<string, number>();
  for (const id of pods) {
    partnerCount.set(id, new Map());
    opponentCount.set(id, new Map());
    partnerLast.set(id, new Map());
    opponentLast.set(id, new Map());
    gameCount.set(id, 0);
  }

  const violations: Violation[] = [];
  const maxOpponentNoRepeatRounds = Math.floor((N - 1) / 2);
  const maxPartnerNoRepeatRounds = N - 1;

  const bump = (
    map: Map<string, Map<string, number>>,
    last: Map<string, Map<string, number>>,
    a: string,
    b: string,
    round: number,
  ) => {
    const ra = map.get(a)!;
    ra.set(b, (ra.get(b) ?? 0) + 1);
    const la = last.get(a)!;
    la.set(b, round);
    const rb = map.get(b)!;
    rb.set(a, (rb.get(a) ?? 0) + 1);
    const lb = last.get(b)!;
    lb.set(a, round);
  };

  rounds.forEach((round, idx) => {
    const rNum = round.round ?? idx + 1;
    for (const g of round.games ?? []) {
      const [A, B] = g.home.pods;
      const [C, D] = g.away.pods;

      // Partner checks for (A,B) and (C,D)
      for (const [x, y] of [
        [A, B],
        [C, D],
      ] as [string, string][]) {
        const c = partnerCount.get(x)!.get(y) ?? 0;
        const last = partnerLast.get(x)!.get(y) ?? 0;
        if (c > 0 && rNum <= maxPartnerNoRepeatRounds) {
          violations.push({
            type: 'partner-repeat-too-early',
            round: rNum,
            pair: [x, y],
          });
        }
        if (last && rNum - last <= recencyWindow) {
          violations.push({
            type: 'partner-recency',
            round: rNum,
            pair: [x, y],
            ago: rNum - last,
          });
        }
      }

      // Opponent checks across pairs
      for (const [x, y] of [
        [A, C],
        [A, D],
        [B, C],
        [B, D],
      ] as [string, string][]) {
        const c = opponentCount.get(x)!.get(y) ?? 0;
        const last = opponentLast.get(x)!.get(y) ?? 0;
        if (c > 0 && rNum <= maxOpponentNoRepeatRounds) {
          violations.push({
            type: 'opponent-repeat-too-early',
            round: rNum,
            pair: [x, y],
          });
        }
        if (last && rNum - last <= recencyWindow) {
          violations.push({
            type: 'opponent-recency',
            round: rNum,
            pair: [x, y],
            ago: rNum - last,
          });
        }
      }

      // Update tallies
      bump(partnerCount, partnerLast, A, B, rNum);
      bump(partnerCount, partnerLast, C, D, rNum);
      for (const [x, y] of [
        [A, C],
        [A, D],
        [B, C],
        [B, D],
      ] as [string, string][]) {
        bump(opponentCount, opponentLast, x, y, rNum);
      }
      for (const id of [A, B, C, D]) {
        gameCount.set(id, gameCount.get(id)! + 1);
      }
    }
  });

  // Fairness
  const counts = Array.from(gameCount.values());
  const maxG = Math.max(...counts);
  const minG = Math.min(...counts);
  const fairness = { max: maxG, min: minG, spread: maxG - minG };
  if (opts.checkFairness && fairness.spread > (opts.maxFairnessSpread ?? 1)) {
    violations.push({
      type: 'fairness-spread',
      spread: fairness.spread,
      max: maxG,
      min: minG,
    });
  }

  // Summaries / thresholds
  const countsByType = {
    'partner-repeat-too-early': 0,
    'partner-recency': 0,
    'opponent-repeat-too-early': 0,
    'opponent-recency': 0,
    'fairness-spread': 0,
  } as Record<ViolationType, number>;

  for (const v of violations) countsByType[v.type]++;

  const pass =
    countsByType['partner-repeat-too-early'] <= opts.maxEarlyPartnerRepeats &&
    countsByType['opponent-repeat-too-early'] <= opts.maxEarlyOppRepeats &&
    countsByType['partner-recency'] + countsByType['opponent-recency'] <=
      opts.maxRecencyViolations &&
    (!opts.checkFairness || fairness.spread <= (opts.maxFairnessSpread ?? 1));

  return {
    violations,
    fairness,
    N,
    maxOpponentNoRepeatRounds,
    maxPartnerNoRepeatRounds,
    countsByType,
    pass,
  };
}
