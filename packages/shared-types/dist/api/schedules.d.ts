export type TeamSide = {
    teamId: string;
    teamName?: string;
} | {
    pods: [string, string];
    teamName?: string;
};
export type ScheduleGameView = {
    gameId: string;
    start: string;
    durationMins: number;
    field: string | null;
    home: TeamSide;
    away: TeamSide;
    meta: Record<string, unknown>;
};
export type RoundView = {
    round: number;
    games: ScheduleGameView[];
};
export type ScheduleView = {
    leagueId?: string;
    rounds: RoundView[];
};
export type Pod = {
    id: string;
    name?: string;
    skill?: number;
};
export type GenerateOptions = {
    rounds: number;
    recencyWindow?: number;
    pairingMode?: 'each-vs-both' | 'single';
    names?: Record<string, string>;
    leagueId?: string;
    fields?: string[];
    startDate?: string;
    startTime?: string;
    durationMins?: number;
    breakBetweenMins?: number;
};
