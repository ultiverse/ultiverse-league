import { api } from './client';
import { ScheduleView, UserProfile, Field } from '@ultiverse/shared-types';
import { LeagueSummary, TeamSummary, GenerateScheduleRequest } from '../types/api';

export const getLeagues = () =>
  api<LeagueSummary[]>('/leagues/recent?integration=external&order_by=date_desc&limit=20');

export const getTeamsByLeague = (eventId: string) =>
  api<Omit<TeamSummary, 'source' | 'syncStatus' | 'integrationProvider'>[]>(`/leagues/${eventId}/teams?integration=external`);

export const generateSchedule = (request: GenerateScheduleRequest) =>
  api<ScheduleView>('/schedules/pods/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });

export const getCurrentUser = () =>
  api<UserProfile>('/user/me');

export const getFieldsByLeagueId = (leagueId: string) =>
  api<Field[]>(`/leagues/${leagueId}/fields?integration=external`);
