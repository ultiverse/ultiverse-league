import { api } from './client';
import { ScheduleView, UserProfile, Field } from '@ultiverse/shared-types';
import { LeagueSummary, TeamSummary, GenerateScheduleRequest, TeamDetail, TeamPlayer } from '../types/api';

export const getLeagues = () =>
  api<LeagueSummary[]>('/leagues');

export const getTeamsByLeague = (eventId: string) =>
  api<Omit<TeamSummary, 'source' | 'syncStatus' | 'integrationProvider'>[]>(`/leagues/${eventId}/teams`);

export const getTeamById = (teamId: string) =>
  api<TeamDetail>(`/teams/${teamId}`);

export const getTeamRoster = (teamId: string) =>
  api<TeamPlayer[]>(`/teams/${teamId}/players`);

export const generateSchedule = (request: GenerateScheduleRequest) =>
  api<ScheduleView>('/schedules/pods/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });

export const getCurrentUser = () =>
  api<UserProfile>('/user/me');

export const getFieldsByLeagueId = (leagueId: string) =>
  api<Field[]>(`/leagues/${leagueId}/fields`);
