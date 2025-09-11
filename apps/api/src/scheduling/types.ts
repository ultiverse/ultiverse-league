export type PodId = string;

// Matrix helpers: m[a][b] is count / last round index, etc.
export type CountMatrix = Record<PodId, Record<PodId, number>>;
export type RoundIndexMatrix = Record<PodId, Record<PodId, number>>;

export interface HistoryState {
  partneredCounts?: CountMatrix; // how many times pods partnered
  opposedCounts?: CountMatrix; // how many times pods opposed (pair vs pair can be modeled via pod-level counts too)
  lastPartneredRound?: RoundIndexMatrix; // most recent round index they partnered
  lastOpposedRound?: RoundIndexMatrix; // most recent round index they opposed
}

export interface SkillRatings {
  [podId: string]: number | undefined; // optional
}

export interface ScheduleInput {
  pods: PodId[];
  rounds: number;
  recencyWindow?: number;
  history?: HistoryState;
  skill?: SkillRatings;
  pairingMode?: 'each-vs-both' | 'one-each';
  baseRoundIndex?: number;
}

export type GameBlock = { a: PodId; b: PodId; c: PodId; d: PodId };
export type RoundBlocks = { round: number; blocks: GameBlock[] };

export interface ScheduleOutput {
  rounds: RoundBlocks[];
}

export interface ScheduleGameView {
  gameId: string;
  start: string; // ISO datetime
  durationMins: number;
  field: { id: string; name: string };
  home: { pods: PodId[]; teamName?: string };
  away: { pods: PodId[]; teamName?: string };
  meta?: Record<string, unknown>;
}

export interface RoundView {
  round: number;
  games: ScheduleGameView[];
}

export interface ScheduleView {
  leagueId?: string;
  rounds: RoundView[];
}
