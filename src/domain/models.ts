export interface Organization {
  id: string;
  name: string;
  externalRefs?: Record<string, string>;
}

export interface League {
  id: string;
  orgId?: string;
  name: string;
  start?: string;
  end?: string;
  type: 'league';
  externalRefs?: Record<string, string>;
}

export interface Team {
  id: string;
  leagueId?: string;
  name: string;
  isPod: boolean;
  skill?: string;
  members?: string[]; // player IDs
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  rating?: number;
  externalRefs?: Record<string, string>;
}

export interface Game {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  start: string;
  duration?: number;
  fieldId?: string;
  meta?: Record<string, unknown>;
}

export interface Field {
  id: string;
  name: string;
  venue?: string;
}
export interface User {
  id: string;
  roles: string[];
  linkedPerson?: string;
}
