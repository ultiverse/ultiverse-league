import { Pagination } from './common';
export interface UCTeam {
    model: 'team';
    id: number;
    name: string;
    slug?: string;
    site_id?: number;
    organization_id?: number | null;
    is_event_team?: boolean;
    division_name?: string | null;
    status?: string | null;
    images?: Record<string, string>;
    [k: string]: unknown;
}
export interface UCTeamsResponse {
    action: string;
    status: number;
    count: number;
    result: UCTeam[];
    errors?: unknown[];
}
export type TeamsQuery = Pagination & Partial<{
    id: number[] | number | string;
    event_id: number;
    team_id: number[];
    team: string;
    site_id: number;
    division_id: number;
    person_id: number;
    order_by: string;
    status: string;
}>;
export declare function toUcTeamsParams(q?: TeamsQuery): Record<string, string | number | boolean> | undefined;
export interface UCTeamRef {
    id?: number;
    name?: string;
    slug?: string;
}
