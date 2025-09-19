import { Pagination } from './common';
import { UCTeamRef } from './teams';

export interface UCGame {
  model: 'game';
  id: number;
  event_id?: number;
  site_id?: number;
  field_id?: number | null;
  field?: string | null; // slug
  date?: string | null; // 'YYYY-MM-DD'
  time?: string | null; // 'HH:mm:ss'
  status?: 'teams_not_set' | 'scheduled' | 'has_outcome' | 'in_progress';
  home_team?: UCTeamRef | null;
  away_team?: UCTeamRef | null;
  home_team_id?: number | null;
  away_team_id?: number | null;
  [k: string]: unknown;
}

export interface UCGamesResponse {
  action: string; // 'api_games_list'
  status: number;
  count: number;
  result: UCGame[];
  errors?: unknown[];
}

export const UC_GAME_STATUS = [
  'teams_not_set',
  'scheduled',
  'has_outcome',
  'in_progress',
] as const;
export type UCGameStatus = (typeof UC_GAME_STATUS)[number];

export type GamesQuery = Pagination &
  Partial<{
    id: number[] | number | string;
    site_id: number;
    network_id: number;
    event_id: number; // 👈 primary we'll use
    stage_id: number;
    team_id: number[]; // multiple
    team: string; // slug
    field_id: number;
    field: string; // slug
    division_id: number;
    person_id: number;
    schedule_group_id: number;
    allow_hidden: boolean;
    active_events_only: boolean;
    recent_events_only: boolean;
    status: UCGameStatus[]; // multiple
    referee_id: number;
    date: string; // 'YYYY-MM-DD'
    time: string; // 'HH:mm:ss'
    min_date: string;
    max_date: string;
    min_end_date: string;
    max_end_date: string;
    min_time: string;
    max_time: string;
    min_end_time: string;
    max_end_time: string;
    weekday: number; // 0..6
    min_start_diff_minutes: number;
    max_start_diff_minutes: number;
    min_end_diff_minutes: number;
    max_end_diff_minutes: number;
    allow_unplayed_ties: boolean;
    limit_returned_fields: boolean;
    order_by: string;
    game_type:
      | 'all'
      | 'missing_result'
      | 'with_result'
      | 'upcoming'
      | 'played'
      | 'live_scoreboard'
      | 'low_game_report'
      | 'conflicting'
      | 'missing_spirit'
      | 'missing_score';
    field_reservation_id: number;
    field_number: string;
    is_practice: boolean;
  }>;

export function toUcGamesParams(
  q?: GamesQuery,
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