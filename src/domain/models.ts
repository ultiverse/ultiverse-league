export type ExternalRefs = {
  uc?: {
    eventId?: number; // UC Event.id
    personId?: number; // UC Person.id
    teamId?: number; // UC Team.id
    orgId?: number; // UC Organization.id
    slug?: string;
    siteId?: number;
  };
  [provider: string]:
    | Record<string, string | number | boolean | null | undefined>
    | undefined;
};

export type Meta = Record<string, unknown>;

export interface Organization {
  id: string;
  name: string;
  externalRefs?: ExternalRefs;
  meta?: Meta;
}

export interface League {
  id: string;
  orgId?: string;
  name: string;
  start?: string; // ISO date
  end?: string; // ISO date
  type: 'league';
  externalRefs?: ExternalRefs;
  meta?: Meta;
}

export type TeamKind = 'team' | 'pod';

export interface Team {
  id: string;
  leagueId?: string;
  name: string;
  kind: TeamKind; // 'pod' for pods, 'team' for regular teams
  skill?: string;
  memberIds?: string[]; // player IDs
  externalRefs?: ExternalRefs;
  meta?: Meta;
}

export interface Player {
  id: string;
  name: string;
  email?: string;
  rating?: number;
  externalRefs?: ExternalRefs;
  meta?: Meta;
}

export interface Game {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  start: string; // ISO datetime
  duration?: number; // minutes
  fieldId?: string;
  meta?: Meta;
  externalRefs?: ExternalRefs;
}

export interface Field {
  id: string;
  name: string;
  venue?: string;
  slots?: string[];
  externalRefs?: ExternalRefs;
  meta?: Meta;
}

export interface User {
  id: string;
  roles: string[];
  linkedPerson?: string;
  externalRefs?: ExternalRefs;
  meta?: Meta;
}
