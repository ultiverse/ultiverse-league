export type PodRef = { id: string; name?: string; skill?: number };

export type PodEngineTeam = {
  pod1: PodRef;
  pod2: PodRef;
};

export type PodEngineMatch = {
  id: string;
  round: number;
  team1: PodEngineTeam;
  team2: PodEngineTeam;
  scheduledTime?: string | null;
  field?: string | null;
  duration?: number;
};

export type PodEngineRound = {
  roundNumber: number;
  matches: PodEngineMatch[];
  date?: string; // set by assignTimesAndFields
  podsPlaying?: string[];
  podsSittingOut?: string[];
};

export type PodEngineSchedule = {
  metadata?: unknown;
  statistics?: unknown;
  rounds: PodEngineRound[];
  scheduling?: {
    startDate: string;
    startTime: string;
    fields: string[];
    matchDuration: number;
    breakBetweenMatches: number;
  };
};
