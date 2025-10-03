import { Injectable } from '@nestjs/common';
import { UCClient } from './uc.client';

export interface UCUserEnrichmentData {
  externalId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  lastSeen?: string;
  avatarUrls?: {
    small?: string;
    large?: string;
  };
  pastTeams?: Array<{
    id: string;
    name: string;
    colour?: string;
    altColour?: string;
    dateJoined: string;
    monthYear: string;
  }>;
  enrichedAt: Date;
}

@Injectable()
export class UCEnrichmentService {
  constructor(private readonly client: UCClient) {}

  /**
   * Get user enrichment data from Ultimate Central
   */
  async getUserEnrichmentData(): Promise<UCUserEnrichmentData | null> {
    try {
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
          images?: {
            '40'?: string;
            '370'?: string;
          };
          teams?: Array<{
            id: number;
            name: string;
            colour?: string;
            alt_colour?: string;
            created_at: string;
          }>;
        }>;
        errors?: unknown[];
      }

      const response =
        await this.client.get<UCPersonsResponse>('/api/persons/me');

      if (!response?.result?.[0]) {
        return null;
      }

      const ucUser = response.result[0];

      // Process teams into enrichment format
      const pastTeams =
        ucUser.teams?.map((team) => {
          const joinDate = new Date(team.created_at);
          return {
            id: team.id.toString(),
            name: team.name,
            colour: team.colour || '#000000',
            altColour: team.alt_colour || '#ffffff',
            dateJoined: team.created_at,
            monthYear: joinDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            }),
          };
        }) || [];

      return {
        externalId: ucUser.id.toString(),
        firstName: ucUser.first_name,
        lastName: ucUser.last_name,
        email: ucUser.email_address,
        gender: ucUser.gender,
        lastSeen: ucUser.last_seen,
        avatarUrls: {
          small: ucUser.images?.['40'],
          large: ucUser.images?.['370'],
        },
        pastTeams,
        enrichedAt: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch UC enrichment data:', error);
      return null;
    }
  }

  /**
   * Check if user exists in UC by email
   */
  async checkUserExists(email: string): Promise<boolean> {
    try {
      const enrichmentData = await this.getUserEnrichmentData();
      return enrichmentData?.email === email;
    } catch (error) {
      console.error('Failed to check UC user existence:', error);
      return false;
    }
  }
}
