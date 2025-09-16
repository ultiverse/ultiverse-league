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
  action: string; // 'api_teams_list'
  status: number;
  count: number;
  result: UCTeam[];
  errors?: unknown[];
}

export type TeamsQuery = Pagination &
  Partial<{
    id: number[] | number | string; // single | array | CSV
    event_id: number; // 👈 primary we’ll use
    team_id: number[]; // multiple allowed
    team: string; // slug
    site_id: number;
    division_id: number;
    person_id: number;
    order_by: string; // UC allows arbitrary field list
    status: string; // not strictly enumerated here
  }>;

export function toUcTeamsParams(
  q?: TeamsQuery,
): Record<string, string | number | boolean> | undefined {
  if (!q) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      if (!v.length) continue;
      out[k] = v.join(',');
    } else if (
      typeof v === 'string' ||
      typeof v === 'number' ||
      typeof v === 'boolean'
    ) {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

export interface UCTeamRef {
  id?: number; // team_id
  name?: string;
  slug?: string;
}
