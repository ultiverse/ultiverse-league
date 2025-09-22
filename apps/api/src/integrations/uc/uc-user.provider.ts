import { Injectable } from '@nestjs/common';
import { IUserProvider, UserProfile, PastTeam } from '../ports/user.port';
import { UCClient } from './uc.client';

interface UCPersonsResponse {
  action: string;
  status: number;
  count: number;
  result: Array<{
    id: number;
    email_address?: string;
    first_name?: string;
    last_name?: string;
    gender?: string;
    last_seen?: string;
    teams?: Array<{
      id: number;
      name: string;
      created_at: string;
    }>;
  }>;
  errors?: unknown[];
}

@Injectable()
export class UcUserProvider implements IUserProvider {
  constructor(private readonly ucClient: UCClient) {}

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const response = await this.ucClient.get<UCPersonsResponse>('/api/persons/me');

      if (!response?.result?.[0]) {
        return null;
      }

      const ucUser = response.result[0];

      // Map gender identification to our simplified format
      const mapGenderIdentification = (genderValue: string): UserProfile['identifies'] => {
        switch (genderValue?.toLowerCase()) {
          case 'male':
            return 'man';
          case 'female':
            return 'woman';
          default:
            return 'not_defined';
        }
      };

      // Process past teams
      const pastTeams: PastTeam[] = (ucUser.teams || []).map((team: any) => ({
        id: team.id.toString(),
        name: team.name,
        dateJoined: team.created_at,
        monthYear: this.formatMonthYear(team.created_at),
      }));

      const userProfile: UserProfile = {
        email: ucUser.email_address || '',
        firstName: ucUser.first_name || '',
        lastName: ucUser.last_name || '',
        integration: 'uc',
        pastTeams,
        lastLogin: ucUser.last_seen || '',
        identifies: mapGenderIdentification(ucUser.gender || ''),
      };

      return userProfile;
    } catch (error) {
      console.error('Failed to fetch current user from UC:', error);
      return null;
    }
  }

  private formatMonthYear(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  }
}