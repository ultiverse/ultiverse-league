export type ExternalRefs = {
    uc?: {
        eventId?: number;
        personId?: number;
        teamId?: number;
        orgId?: number;
        slug?: string;
        siteId?: number;
    };
    [provider: string]: Record<string, string | number | boolean | null | undefined> | undefined;
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
    start?: string;
    end?: string;
    type: 'league';
    externalRefs?: ExternalRefs;
    meta?: Meta;
}
export type TeamKind = 'team' | 'pod';
export interface Team {
    id: string;
    leagueId?: string;
    name: string;
    kind: TeamKind;
    skill?: string;
    memberIds?: string[];
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
    start: string;
    duration?: number;
    fieldId?: string;
    meta?: Meta;
    externalRefs?: ExternalRefs;
}
export interface Subfield {
    id: string;
    name: string;
    surface?: string;
    externalRefs?: ExternalRefs;
    meta?: Meta;
}
export interface Field {
    id: string;
    name: string;
    venue: string;
    subfields: Subfield[];
    map?: string;
    surface?: string;
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
