import { Injectable, Logger } from '@nestjs/common';
import { UCClient } from './uc.client';
import { TeamsService, ExternalTeamData } from '../../teams/teams.service';

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
  private readonly logger = new Logger(UCEnrichmentService.name);

  constructor(
    private readonly client: UCClient,
    private readonly teamsService: TeamsService,
  ) {}

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

  /**
   * Import teams from Ultimate Central into the canonical teams schema
   * This is called when a user connects their UC account
   */
  async importTeamsForUser(
    userId: string,
    organizationId: string,
  ): Promise<{ imported: number; errors: number }> {
    try {
      // Fetch user data from UC
      interface UCPersonsResponse {
        action: string;
        status: number;
        count: number;
        result: Array<{
          id: number;
          teams?: Array<{
            id: number;
            name: string;
            colour?: string;
            alt_colour?: string;
            created_at: string;
          }>;
        }>;
      }

      const response =
        await this.client.get<UCPersonsResponse>('/api/persons/me');

      if (!response?.result?.[0]?.teams) {
        this.logger.log('No teams found for user in UC');
        return { imported: 0, errors: 0 };
      }

      const ucTeams = response.result[0].teams;
      let imported = 0;
      let errors = 0;

      // Import each team using the deduplication logic
      for (const ucTeam of ucTeams) {
        try {
          const joinDate = new Date(ucTeam.created_at);

          // Estimate season dates based on join date
          // Assume season starts in the month joined and lasts 3 months
          const seasonStart = new Date(
            joinDate.getFullYear(),
            joinDate.getMonth(),
            1,
          );
          const seasonEnd = new Date(
            joinDate.getFullYear(),
            joinDate.getMonth() + 3,
            0,
          );

          const externalTeamData: ExternalTeamData = {
            externalId: ucTeam.id.toString(),
            source: 'uc',
            name: ucTeam.name,
            seasonStart,
            seasonEnd,
            colour: ucTeam.colour || '#000000',
            altColour: ucTeam.alt_colour || '#ffffff',
            rawData: {
              ucTeamId: ucTeam.id,
              created_at: ucTeam.created_at,
            },
          };

          await this.teamsService.importExternalTeam(
            userId,
            organizationId,
            externalTeamData,
          );

          imported++;
        } catch (error) {
          this.logger.error(
            `Failed to import UC team ${ucTeam.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          errors++;
        }
      }

      this.logger.log(
        `Imported ${imported} teams from UC for user ${userId} (${errors} errors)`,
      );
      return { imported, errors };
    } catch (error) {
      this.logger.error(
        `Failed to import teams from UC: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return { imported: 0, errors: 1 };
    }
  }
}
