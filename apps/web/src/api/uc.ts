import { api } from './client';

export type UCEvent = { id: number; name: string };
export type UCTeam  = { id: number; name: string };

export const getLeagues = () => api<UCEvent[]>('/uc/events');
export const getTeamsByLeague = (eventId: number) =>
  api<UCTeam[]>(`/uc/teams?event_id=${eventId}`);
