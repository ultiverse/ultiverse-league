import { Injectable } from '@nestjs/common';
import blossom from 'edmonds-blossom';
import type {
  PodRef,
  PodEngineMatch,
  PodEngineRound,
  PodEngineSchedule,
} from './pod-engine.types';

export type PodSchedulerOptions = {
  recencyWindow?: number;
  skillWeight?: number;
};

/**
 * PodSchedulerService: two-stage matching per round
 * Stage A (partners): pods -> pairs
 * Stage B (opponents): pairs -> games
 *
 * Priorities (MVP):
 *  - Unseen-first: forbid repeats until all unique combos seen (large penalty)
 *  - Recency: penalize/rematch within recent rounds (default window=2)
 *  - Fairness-lite: rotate byes when N%4!=0; schedule lower-game pods first
 *  - Optional: tiny skill-balance penalty
 *
 * Ported 1:1 from JS to TS; behavior preserved. (See original podscheduler.js) :contentReference[oaicite:3]{index=3}
 */
@Injectable()
export class PodSchedulerService {
  private recencyWindow = 2;
  private skillWeight = 0.5;
  private readonly LARGE = 1e6;

  // tracking
  private partnerCount!: Map<string, Map<string, number>>;
  private opponentCount!: Map<string, Map<string, number>>;
  private partnerLast!: Map<string, Map<string, number>>;
  private opponentLast!: Map<string, Map<string, number>>;
  private gameCount!: Map<string, number>;

  //   constructor(opts?: { recencyWindow?: number; skillWeight?: number }) {
  //     this.recencyWindow = opts?.recencyWindow ?? 2;
  //     this.skillWeight = opts?.skillWeight ?? 0.5;
  //   }
  constructor() {}

  private get _isTest(): boolean {
    return process.env.NODE_ENV === 'test';
  }
  private _rand(): number {
    return this._isTest ? 0.5 : Math.random();
  }

  /** Public API */
  generateSchedule(
    pods: PodRef[],
    opts: {
      rounds?: number;
      recencyWindow?: number;
      gamesPerRound?: number;
    } = {},
  ) {
    if (opts.recencyWindow != null) this.recencyWindow = opts.recencyWindow;

    this._initTracking(pods);

    const matchesPerRound = opts.gamesPerRound ?? Math.floor(pods.length / 4);
    const roundsOut: PodEngineRound[] = [];

    const rounds = opts.rounds ?? 1;
    for (let r = 1; r <= rounds; r++) {
      // Sort pods by fewest games (fairness), light shuffle
      const shuffled = [...pods]
        .sort((a, b) => this.gameCount.get(a.id)! - this.gameCount.get(b.id)!)
        .map((v) => ({ v, t: Math.random() }))
        .sort((a, b) => a.t - b.t)
        .map(({ v }) => v);

      // Handle byes if not multiple of 4 — give byes to pods with MOST games so far
      const rem = shuffled.length % 4;
      let usable = shuffled;
      let byes: PodRef[] = [];

      const { opponentNoRepeatRounds, partnerNoRepeatRounds } =
        this._noRepeatWindows(pods.length);
      const strictOpponent = r <= opponentNoRepeatRounds;
      const strictPartner = r <= partnerNoRepeatRounds;

      if (rem !== 0) {
        byes = [...shuffled]
          .sort((a, b) => this.gameCount.get(b.id)! - this.gameCount.get(a.id)!)
          .slice(0, rem);
        const byeIds = new Set(byes.map((p) => p.id));
        usable = shuffled.filter((p) => !byeIds.has(p.id));
      }

      let selected: PodEngineMatch[] = [];

      if (usable.length >= 4) {
        // --- Stage A & B with constructive attempts (avoid opponent repeats) ---
        const OUTER_ATTEMPTS = 10;
        const INNER_RESEEDS = 12;
        let finalPairs: [PodRef, PodRef][] | null = null;
        let games: [[PodRef, PodRef], [PodRef, PodRef]][] = [];

        for (let attempt = 0; attempt < OUTER_ATTEMPTS; attempt++) {
          const jitter = attempt === 0 ? 0 : 50; // explore alternates
          const banPairs = new Set<string>();
          let solved = false;

          for (let reseed = 0; reseed < INNER_RESEEDS; reseed++) {
            // Stage A: partners (strictPartner, with bans)
            const pairsTry = this._matchPartners(usable, r, {
              strict: strictPartner,
              jitter,
              banPairs,
            });
            if (pairsTry.length * 2 !== usable.length) break; // infeasible under bans; next attempt

            // Quick feasibility: degrees in opponent graph (no-repeat/recency)
            const deg = this._pairDegrees(pairsTry, r, strictOpponent);
            const zeroIdx = deg.findIndex((d) => d === 0);
            if (zeroIdx !== -1) {
              const [X, Y] = pairsTry[zeroIdx];
              banPairs.add(this._pairKey(X.id, Y.id));
              continue;
            }

            // Stage B: opponents (respecting strictOpponent & recency blocks)
            const gamesTry = this._matchOpponents(pairsTry, r, {
              strict: strictOpponent,
            });
            if (gamesTry.length * 2 !== pairsTry.length) {
              // Choose least-flexible pair and ban it
              let minDeg = Infinity,
                minIdx = -1;
              for (let i = 0; i < deg.length; i++) {
                if (deg[i] < minDeg) {
                  minDeg = deg[i];
                  minIdx = i;
                }
              }
              if (minIdx >= 0) {
                const [X, Y] = pairsTry[minIdx];
                banPairs.add(this._pairKey(X.id, Y.id));
                continue;
              }
              break;
            }

            // Defensive: ensure no opponent repeat under strict window
            if (strictOpponent && this._gamesHaveOpponentRepeat(gamesTry)) {
              let minDeg = Infinity,
                minIdx = -1;
              for (let i = 0; i < deg.length; i++) {
                if (deg[i] < minDeg) {
                  minDeg = deg[i];
                  minIdx = i;
                }
              }
              if (minIdx >= 0) {
                const [X, Y] = pairsTry[minIdx];
                banPairs.add(this._pairKey(X.id, Y.id));
                continue;
              }
            }

            finalPairs = pairsTry;
            games = gamesTry;
            solved = true;
            break;
          }
          if (solved) break;
        }

        // Last-resort fallback (should not trigger for 12×6; safe for small N too)
        if (!finalPairs) {
          let pairs = this._matchPartners(usable, r, {
            strict: strictPartner,
            jitter: 0,
            banPairs: new Set<string>(),
          });
          if (pairs.length * 2 !== usable.length)
            pairs = this._matchPartners(usable, r, {
              strict: false,
              jitter: 0,
              banPairs: new Set<string>(),
            });
          if (pairs.length >= 2) {
            let gTry = this._matchOpponents(pairs, r, {
              strict: strictOpponent,
            });
            if (gTry.length < 1)
              gTry = this._matchOpponents(pairs, r, { strict: false });
            games = gTry;
            finalPairs = pairs;
          }
        }

        if (finalPairs && games.length > 0) {
          selected = games.slice(0, matchesPerRound).map((g, i) => ({
            id: `r${r}_m${i + 1}`,
            round: r,
            team1: { pod1: g[0][0], pod2: g[0][1] },
            team2: { pod1: g[1][0], pod2: g[1][1] },
            scheduledTime: null,
            field: null,
            duration: 90,
          }));
        }
      }

      if (selected.length === 0) {
        const podsSittingOut = usable
          .map((p) => p.id)
          .concat(byes.map((b) => b.id));
        roundsOut.push({
          roundNumber: r,
          matches: [],
          podsPlaying: [],
          podsSittingOut,
        });
      } else {
        this._updateTracking(selected, r);
        const playing = new Set<string>();
        selected.forEach((m) =>
          [m.team1.pod1, m.team1.pod2, m.team2.pod1, m.team2.pod2].forEach(
            (p) => playing.add(p.id),
          ),
        );
        const podsSittingOut = pods
          .filter((p) => !playing.has(p.id))
          .map((p) => p.id)
          .concat(byes.map((b) => b.id));
        roundsOut.push({
          roundNumber: r,
          matches: selected,
          podsPlaying: Array.from(playing),
          podsSittingOut,
        });
      }
    }

    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        podCount: pods.length,
        recencyWindow: this.recencyWindow,
      },
      rounds: roundsOut,
      statistics: this._stats(pods, roundsOut),
    };
  }

  /** Assign weekly time/field slots */
  assignTimesAndFields(
    schedule: PodEngineSchedule,
    {
      startDate = new Date().toISOString().slice(0, 10),
      startTime = '18:00',
      fields = ['Field 1', 'Field 2'],
      matchDuration = 90,
      breakBetweenMatches = 15,
    }: {
      startDate?: string;
      startTime?: string;
      fields?: string[];
      matchDuration?: number;
      breakBetweenMatches?: number;
    } = {},
  ): PodEngineSchedule {
    const rounds = schedule.rounds.map((round, idx) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + idx * 7);
      const day = date.toISOString().slice(0, 10);
      const matches = round.matches.map((m, i) => {
        const field = fields[i % fields.length];
        const slot = Math.floor(i / fields.length);
        const start = new Date(`${day}T${startTime}:00Z`);
        start.setMinutes(
          start.getMinutes() + slot * (matchDuration + breakBetweenMatches),
        );
        return {
          ...m,
          field,
          scheduledTime: start.toISOString(),
          duration: matchDuration,
        };
      });
      return { ...round, matches, date: day };
    });
    return {
      ...schedule,
      rounds,
      scheduling: {
        startDate,
        startTime,
        fields,
        matchDuration,
        breakBetweenMatches,
      },
    };
  }

  exportCSV(schedule: PodEngineSchedule): string {
    const headers = [
      'Round',
      'MatchID',
      'Date',
      'Time',
      'Field',
      'Team1_P1',
      'Team1_P2',
      'Team2_P1',
      'Team2_P2',
    ];
    const rows = [headers.join(',')];
    for (const round of schedule.rounds) {
      for (const m of round.matches) {
        const t = m.scheduledTime
          ? new Date(m.scheduledTime).toISOString().split('T')[1].slice(0, 5)
          : '';
        rows.push(
          [
            round.roundNumber,
            m.id,
            round.date ?? '',
            t,
            m.field ?? '',
            m.team1.pod1.name ?? m.team1.pod1.id,
            m.team1.pod2.name ?? m.team1.pod2.id,
            m.team2.pod1.name ?? m.team2.pod1.id,
            m.team2.pod2.name ?? m.team2.pod2.id,
          ].join(','),
        );
      }
    }
    return rows.join('\n');
  }

  exportICS(schedule: PodEngineSchedule): string {
    let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Pods Scheduler//EN\n';
    for (const round of schedule.rounds) {
      for (const m of round.matches) {
        if (!m.scheduledTime) continue;
        const start = new Date(m.scheduledTime);
        const end = new Date(start.getTime() + (m.duration ?? 90) * 60000);
        const fmt = (d: Date) =>
          d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const summary = `${m.team1.pod1.name ?? m.team1.pod1.id} & ${m.team1.pod2.name ?? m.team1.pod2.id} vs ${m.team2.pod1.name ?? m.team2.pod1.id} & ${m.team2.pod2.name ?? m.team2.pod2.id}`;
        ics += 'BEGIN:VEVENT\n';
        ics += `UID:${m.id}@pods-scheduler\n`;
        ics += `DTSTART:${fmt(start)}\n`;
        ics += `DTEND:${fmt(end)}\n`;
        ics += `SUMMARY:${summary}\n`;
        ics += `DESCRIPTION:Round ${round.roundNumber}\n`;
        ics += `LOCATION:${m.field ?? 'TBD'}\n`;
        ics += 'END:VEVENT\n';
      }
    }
    ics += 'END:VCALENDAR';
    return ics;
  }

  // ---------- internals (ported) ----------

  private _initTracking(pods: PodRef[]): void {
    this.partnerCount = new Map();
    this.opponentCount = new Map();
    this.partnerLast = new Map();
    this.opponentLast = new Map();
    this.gameCount = new Map();
    for (const p of pods) {
      this.partnerCount.set(p.id, new Map());
      this.opponentCount.set(p.id, new Map());
      this.partnerLast.set(p.id, new Map());
      this.opponentLast.set(p.id, new Map());
      this.gameCount.set(p.id, 0);
    }
  }

  private _matchPartners(
    pods: PodRef[],
    roundNumber: number,
    opts: { strict: boolean; jitter: number; banPairs: Set<string> },
  ): [PodRef, PodRef][] {
    const n = pods.length;
    const edges: [number, number, number][] = [];
    const pairKey = (a: string, b: string) =>
      a < b ? `${a}|${b}` : `${b}|${a}`;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const A = pods[i],
          B = pods[j];
        const pid = A.id,
          qid = B.id;

        if (opts.banPairs.has(pairKey(pid, qid))) continue;

        const count = this._get(this.partnerCount, pid, qid) || 0;
        const last = this._get(this.partnerLast, pid, qid) || 0;
        const ago = last ? roundNumber - last : Infinity;

        if (opts.strict) {
          if (count > 0) continue;
          if (ago <= this.recencyWindow) continue;
        }

        let c = 0;
        if (!opts.strict) {
          c += count * 200;
          if (ago <= this.recencyWindow) c += 1000;
        }
        if (opts.jitter) c += (this._rand() - 0.5) * opts.jitter;
        c += this.skillWeight * Math.abs((A.skill ?? 0) - (B.skill ?? 0));

        edges.push([i, j, -c]); // blossom maximizes
      }
    }

    const mate = blossom(edges);
    const seen = new Set<number>();
    const out: [PodRef, PodRef][] = [];
    for (let i = 0; i < mate.length; i++) {
      if (mate[i] >= 0 && !seen.has(i) && !seen.has(mate[i])) {
        out.push([pods[i], pods[mate[i]]]);
        seen.add(i);
        seen.add(mate[i]);
      }
    }
    if (out.length * 2 > n) out.pop();
    return out;
  }

  private _matchOpponents(
    pairs: [PodRef, PodRef][],
    roundNumber: number,
    { strict }: { strict: boolean },
  ): [[PodRef, PodRef], [PodRef, PodRef]][] {
    if (pairs.length % 2 !== 0) {
      pairs = pairs.slice(0, pairs.length - 1);
    }
    const m = pairs.length;
    const edges: [number, number, number][] = [];

    const isAllowed = (P: [PodRef, PodRef], Q: [PodRef, PodRef]) => {
      const [A, B] = P,
        [C, D] = Q;
      const cross: [PodRef, PodRef][] = [
        [A, C],
        [A, D],
        [B, C],
        [B, D],
      ];
      for (const [X, Y] of cross) {
        const count = this._get(this.opponentCount, X.id, Y.id) || 0;
        const last = this._get(this.opponentLast, X.id, Y.id) || 0;
        const ago = last ? roundNumber - last : Infinity;
        if (ago <= this.recencyWindow) return false; // hard block recency
        if (strict && count > 0) return false; // hard block early repeats
      }
      return true;
    };

    const pairCost = (P: [PodRef, PodRef], Q: [PodRef, PodRef]) => {
      const [A, B] = P,
        [C, D] = Q;
      let c = 0;
      if (!strict) {
        const cross: [PodRef, PodRef][] = [
          [A, C],
          [A, D],
          [B, C],
          [B, D],
        ];
        for (const [X, Y] of cross) {
          const count = this._get(this.opponentCount, X.id, Y.id) || 0;
          const last = this._get(this.opponentLast, X.id, Y.id) || 0;
          const ago = last ? roundNumber - last : Infinity;
          c += count * 200;
          if (ago <= this.recencyWindow) c += 1000;
        }
      }
      const s1 = (A.skill ?? 0) + (B.skill ?? 0);
      const s2 = (C.skill ?? 0) + (D.skill ?? 0);
      c += 0.25 * Math.abs(s1 - s2);
      return c;
    };

    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        if (!isAllowed(pairs[i], pairs[j])) continue;
        edges.push([i, j, -pairCost(pairs[i], pairs[j])]);
      }
    }

    const mate = blossom(edges);
    const seen = new Set<number>();
    const games: [[PodRef, PodRef], [PodRef, PodRef]][] = [];
    for (let i = 0; i < mate.length; i++) {
      if (mate[i] >= 0 && !seen.has(i) && !seen.has(mate[i])) {
        games.push([pairs[i], pairs[mate[i]]]);
        seen.add(i);
        seen.add(mate[i]);
      }
    }
    if (games.length * 2 > m) games.pop();
    return games;
  }

  private _updateTracking(
    matches: PodEngineMatch[],
    roundNumber: number,
  ): void {
    for (const m of matches) {
      const A = m.team1.pod1,
        B = m.team1.pod2,
        C = m.team2.pod1,
        D = m.team2.pod2;
      this._bump(this.partnerCount, this.partnerLast, A.id, B.id, roundNumber);
      this._bump(this.partnerCount, this.partnerLast, C.id, D.id, roundNumber);
      for (const [x, y] of [
        [A, C],
        [A, D],
        [B, C],
        [B, D],
      ] as const) {
        this._bump(
          this.opponentCount,
          this.opponentLast,
          x.id,
          y.id,
          roundNumber,
        );
      }
      [A, B, C, D].forEach((p) =>
        this.gameCount.set(p.id, (this.gameCount.get(p.id) || 0) + 1),
      );
    }
  }

  private _stats(pods: PodRef[], rounds: PodEngineRound[]) {
    const partnerRepeats = new Map<string, number>();
    const opponentRepeats = new Map<string, number>();
    for (const p of pods) {
      partnerRepeats.set(p.id, 0);
      opponentRepeats.set(p.id, 0);
    }

    for (const p of pods) {
      const prow = this.partnerCount.get(p.id) || new Map();
      const orow = this.opponentCount.get(p.id) || new Map();
      for (const [, c] of prow)
        if (c > 1)
          partnerRepeats.set(p.id, partnerRepeats.get(p.id)! + (c - 1));
      for (const [, c] of orow)
        if (c > 1)
          opponentRepeats.set(p.id, opponentRepeats.get(p.id)! + (c - 1));
    }

    const perPod = pods.map((p) => ({
      id: p.id,
      name: p.name,
      games: this.gameCount.get(p.id) || 0,
      uniquePartners: Array.from(
        (this.partnerCount.get(p.id) || new Map()).entries(),
      ).filter(([, c]) => c > 0).length,
      uniqueOpponents: Array.from(
        (this.opponentCount.get(p.id) || new Map()).entries(),
      ).filter(([, c]) => c > 0).length,
      partnerRepeats: partnerRepeats.get(p.id) || 0,
      opponentRepeats: opponentRepeats.get(p.id) || 0,
    }));

    const games = perPod.map((p) => p.games);
    const avg = games.reduce((a, b) => a + b, 0) / (games.length || 1);
    const variance =
      games.reduce((s, g) => s + Math.pow(g - avg, 2), 0) / (games.length || 1);

    const byes: Record<string, number> = {};
    for (const p of pods) byes[p.id] = 0;
    for (const r of rounds)
      for (const pid of r.podsSittingOut || [])
        if (byes[pid] != null) byes[pid] += 1;

    return {
      averageGamesPerPod: Number.isFinite(avg) ? +avg.toFixed(2) : 0,
      variance: Number.isFinite(variance) ? +variance.toFixed(2) : 0,
      byes,
      perPod,
    };
  }

  private _get(
    map2d: Map<string, Map<string, number>>,
    a: string,
    b: string,
  ): number | undefined {
    const row = map2d.get(a);
    return row ? row.get(b) : undefined;
  }

  private _bump(
    countMap: Map<string, Map<string, number>>,
    lastMap: Map<string, Map<string, number>>,
    a: string,
    b: string,
    roundNumber: number,
  ): void {
    const inc = (x: string, y: string) => {
      const row = countMap.get(x)!;
      row.set(y, (row.get(y) || 0) + 1);
      lastMap.get(x)!.set(y, roundNumber);
    };
    inc(a, b);
    inc(b, a);
  }

  private _gamesHaveOpponentRepeat(
    games: [[PodRef, PodRef], [PodRef, PodRef]][],
  ): boolean {
    for (const [[A, B], [C, D]] of games) {
      const pairs: [PodRef, PodRef][] = [
        [A, C],
        [A, D],
        [B, C],
        [B, D],
      ];
      for (const [X, Y] of pairs) {
        const c = this._get(this.opponentCount, X.id, Y.id) || 0;
        if (c > 0) return true;
      }
    }
    return false;
  }

  private _pairKey(aId: string, bId: string): string {
    return aId < bId ? `${aId}|${bId}` : `${bId}|${aId}`;
  }

  private _noRepeatWindows(nPods: number): {
    opponentNoRepeatRounds: number;
    partnerNoRepeatRounds: number;
  } {
    return {
      opponentNoRepeatRounds: Math.floor((nPods - 1) / 2),
      partnerNoRepeatRounds: nPods - 1,
    };
  }

  private _opponentEdgeAllowed(
    pair1: [PodRef, PodRef],
    pair2: [PodRef, PodRef],
    roundNumber: number,
    strictOpponent: boolean,
  ): boolean {
    const [A, B] = pair1;
    const [C, D] = pair2;
    const cross: [PodRef, PodRef][] = [
      [A, C],
      [A, D],
      [B, C],
      [B, D],
    ];
    for (const [X, Y] of cross) {
      const count = this._get(this.opponentCount, X.id, Y.id) || 0;
      const last = this._get(this.opponentLast, X.id, Y.id) || 0;
      if (last) {
        const ago = roundNumber - last;
        if (ago <= this.recencyWindow) return false;
      }
      if (strictOpponent && count > 0) return false;
    }
    return true;
  }

  private _pairDegrees(
    pairs: [PodRef, PodRef][],
    roundNumber: number,
    strictOpponent: boolean,
  ): number[] {
    const m = pairs.length;
    const deg: number[] = new Array<number>(m).fill(0);
    for (let i = 0; i < m; i++) {
      for (let j = i + 1; j < m; j++) {
        if (
          this._opponentEdgeAllowed(
            pairs[i],
            pairs[j],
            roundNumber,
            strictOpponent,
          )
        ) {
          deg[i]++;
          deg[j]++;
        }
      }
    }
    return deg;
  }
}
