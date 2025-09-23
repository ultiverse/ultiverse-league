import { api } from './client';
import { ScheduleView, UserProfile } from '@ultiverse/shared-types';

export interface LeagueSummary {
  id: string;
  name: string;
  start?: string;
  end?: string;
  provider?: string;
  externalId?: string;
}

export interface TeamSummary {
  id: string;
  name: string;
  division?: string | null;
  colour: string; // Primary team color, defaults to black
  altColour: string; // Secondary team color, defaults to white
  dateJoined?: string; // ISO date (for past teams)
  monthYear?: string; // e.g., "June 2023" (for past teams)
}

export const getLeagues = () =>
  api<LeagueSummary[]>('/api/v1/leagues/recent?integration=external&order_by=date_desc&limit=20');

export const getTeamsByLeague = (eventId: string) =>
  api<TeamSummary[]>(`/api/v1/leagues/${eventId}/teams?integration=external`);

export interface GenerateScheduleRequest {
  pods: string[];
  rounds: number;
  recencyWindow?: number;
  pairingMode?: 'each-vs-both' | 'single';
  names?: Record<string, string>;
  leagueId?: string;
}

export const generateSchedule = (request: GenerateScheduleRequest) =>
  api<ScheduleView>('/api/v1/schedules/pods/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });

export const getCurrentUser = () =>
  api<UserProfile>('/api/v1/user/me');
