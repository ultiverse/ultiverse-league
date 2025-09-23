import { TeamSummary } from './teams.port';

export type PastTeam = TeamSummary;

export interface UserProfile {
  email: string;
  firstName: string;
  lastName: string;
  integration: 'uc' | 'native'; // connected via Ultimate Central or native auth
  pastTeams: PastTeam[];
  lastLogin: string; // ISO date
  identifies: 'man' | 'boy' | 'woman' | 'girl' | 'not_defined';
  avatarSmall?: string; // Small avatar URL
  avatarLarge?: string; // Large avatar URL
}

export interface IUserProvider {
  getCurrentUser(): Promise<UserProfile | null>;
}
