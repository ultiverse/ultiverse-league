export type TeamSide =
  | { teamId: string; teamName?: string }
  | { pods: [string, string]; teamName?: string };

export type ScheduleGameView = {
  gameId: string;
  start: string; // ISO
  durationMins: number; // e.g., 60/90
  field: string | null;
  home: TeamSide;
  away: TeamSide;
  meta: Record<string, unknown>;
};

export type RoundView = { round: number; games: ScheduleGameView[] };

export type ScheduleView = { leagueId?: string; rounds: RoundView[] };

export type Pod = { id: string; name?: string; skill?: number };

export type GenerateOptions = {
  rounds: number;
  recencyWindow?: number;
  pairingMode?: 'each-vs-both' | 'single'; // reserved for future
  names?: Record<string, string>;
  leagueId?: string;
  fields?: string[];
  startDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:mm (local)
  durationMins?: number; // default 90
  breakBetweenMins?: number; // default 15
};