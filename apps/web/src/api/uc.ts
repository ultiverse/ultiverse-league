import { api } from './client';
import { UCEventsResponse, UCTeamsResponse } from '@ultiverse/shared-types';

export const getLeagues = () => api<UCEventsResponse>('/uc/events');
export const getTeamsByLeague = (eventId: number) =>
  api<UCTeamsResponse>(`/uc/teams?event_id=${eventId}`);
