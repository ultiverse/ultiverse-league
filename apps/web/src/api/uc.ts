import { api } from './client';
import { UCEventsResponse, UCTeamsResponse, ScheduleView } from '@ultiverse/shared-types';

export const getLeagues = () => api<UCEventsResponse>('/uc/events?order_by=date_desc');
export const getTeamsByLeague = (eventId: number) =>
  api<UCTeamsResponse>(`/uc/teams?event_id=${eventId}`);

export interface GenerateScheduleRequest {
  pods: string[];
  rounds: number;
  recencyWindow?: number;
  pairingMode?: 'each-vs-both' | 'single';
  names?: Record<string, string>;
  leagueId?: string;
}

export const generateSchedule = (request: GenerateScheduleRequest) =>
  api<ScheduleView>('/schedules/pods/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
