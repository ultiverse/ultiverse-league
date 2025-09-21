import { api } from './client';
import { ScheduleView } from '@ultiverse/shared-types';

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
