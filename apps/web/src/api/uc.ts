import { api } from './client';
import { ScheduleView, UserProfile, Field } from '@ultiverse/shared-types';
import { LeagueSummary, TeamSummary, GenerateScheduleRequest } from '../types/api';

// Re-export types for backward compatibility
export { LeagueSummary, TeamSummary, GenerateScheduleRequest };

export const getLeagues = () =>
  api<LeagueSummary[]>('/api/v1/leagues/recent?integration=external&order_by=date_desc&limit=20');

export const getTeamsByLeague = (eventId: string) =>
  api<TeamSummary[]>(`/api/v1/leagues/${eventId}/teams?integration=external`);

export const generateSchedule = (request: GenerateScheduleRequest) =>
  api<ScheduleView>('/api/v1/schedules/pods/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });

export const getCurrentUser = () =>
  api<UserProfile>('/api/v1/user/me');

export const getFieldsByLeagueId = (leagueId: string) =>
  api<Field[]>(`/api/v1/leagues/${leagueId}/fields?integration=external`);
