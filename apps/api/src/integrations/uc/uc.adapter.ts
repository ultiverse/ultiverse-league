import { Injectable } from '@nestjs/common';

import type {
  ILeagueProvider,
  LeagueSummary,
  LeagueListOptions,
} from '../ports/leagues.port';
import type {
  IRegistrationProvider,
  Registration,
} from '../ports/registrations.port';
import type { ITeamsProvider, TeamSummary } from '../ports/teams.port';
import type { IGamesProvider, GameSummary } from '../ports/games.port';
import type { IUserProvider, UserProfile } from '../ports/user.port';
import type { IFieldsProvider } from '../ports/fields.port';
import { Field } from '@ultiverse/shared-types';

import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';
import { UCGamesService } from './uc.games/uc.games.service';
import { UCFieldsService } from './uc.fields/uc.fields.service';
import { UCClient } from './uc.client';
import { UCField } from './types/fields';
import { UCStartParam, UC_EVENT_ORDER_BY } from '@ultiverse/shared-types';

/**
 * UCAdapter implements all Integration ports using Ultimate Central.
 * This keeps the rest of the app provider-agnostic.
 */
@Injectable()
export class UCAdapter
  implements
    ILeagueProvider,
    IRegistrationProvider,
    ITeamsProvider,
    IGamesProvider,
    IUserProvider,
    IFieldsProvider
{
  constructor(
    private readonly events: UCEventsService,
    private readonly regs: UCRegistrationsService,
    private readonly teams: UCTeamsService,
    private readonly games: UCGamesService,
    private readonly fields: UCFieldsService,
    private readonly client: UCClient,
  ) {}

  /** List recent/current league-like events from UC. */
  async listRecent(options?: LeagueListOptions): Promise<LeagueSummary[]> {
    // Default to 'all' to show more leagues for testing, but allow override
    const start: UCStartParam =
      options?.start &&
      ['all', 'current', 'future', 'ongoing'].includes(options.start)
        ? (options.start as UCStartParam)
        : 'all';

    const orderBy =
      options?.order_by &&
      (UC_EVENT_ORDER_BY as readonly string[]).includes(options.order_by)
        ? (options.order_by as (typeof UC_EVENT_ORDER_BY)[number])
        : 'date_desc';

    const res = await this.events.list({
      start,
      type: ['league'],
      order_by: orderBy,
      per_page: options?.limit || 20, // Show up to 20 recent leagues by default
    });
    const rows = Array.isArray(res.result) ? res.result : [];
    return rows.map((e) => ({
      id: String(e.id),
      name: e.name,
      start: e.start,
      end: e.end,
      provider: 'uc',
      externalId: String(e.id),
    }));
  }

  /** Fetch a single league by its UC id. */
  async getLeagueById(id: string): Promise<LeagueSummary | null> {
    const row = await this.events.getById(Number(id));
    if (!row) return null;
    return {
      id: String(row.id),
      name: row.name,
      start: row.start,
      end: row.end,
      provider: 'uc',
      externalId: String(row.id),
    };
  }

  /** List UC registrations for a league, optionally including Person. */
  async listRegistrations(
    leagueExternalId: string,
    includePerson: boolean,
  ): Promise<Registration[]> {
    const res = await this.regs.list(Number(leagueExternalId), includePerson);
    const rows = Array.isArray(res.result) ? res.result : [];
    return rows.map((r) => {
      const person = r.Person
        ? {
            id: String(r.Person.id),
            name:
              r.Person.full_name ??
              ([r.Person.first_name, r.Person.last_name]
                .filter(Boolean)
                .join(' ') ||
                undefined),
            email: r.Person.email_address ?? r.Person.email_canonical ?? null,
          }
        : null;

      return {
        id: String(r.id),
        leagueExternalId,
        status: r.status,
        person,
      };
    });
  }

  /** List UC teams for a league. */
  async listTeams(
    leagueExternalId: string,
    page = 1,
    perPage = 100,
  ): Promise<TeamSummary[]> {
    const res = await this.teams.list({
      event_id: Number(leagueExternalId),
      page,
      per_page: perPage,
    });
    const rows = Array.isArray(res.result) ? res.result : [];
    return rows.map((t) => ({
      id: String(t.id),
      name: t.name,
      division: t.division_name ?? null,
      colour: typeof t.color === 'string' ? t.color : '#000000',
      altColour: '#ffffff',
    }));
  }

  /** List UC games for a league. */
  async listGames(
    leagueExternalId: string,
    opts?: { page?: number; perPage?: number },
  ): Promise<GameSummary[]> {
    const { page = 1, perPage = 100 } = opts ?? {};
    const res = await this.games.list({
      event_id: Number(leagueExternalId),
      page,
      per_page: perPage,
    });
    const rows = Array.isArray(res.result) ? res.result : [];
    return rows.map((g) => ({
      id: String(g.id),
      eventId: g.event_id ? String(g.event_id) : undefined,
      date: g.date ?? null,
      time: g.time ?? null,
      status: g.status,
      homeTeam: g.home_team
        ? {
            id: g.home_team.id ? String(g.home_team.id) : undefined,
            name: g.home_team.name,
          }
        : null,
      awayTeam: g.away_team
        ? {
            id: g.away_team.id ? String(g.away_team.id) : undefined,
            name: g.away_team.name,
          }
        : null,
    }));
  }

  /** List UC fields for a league. */
  async listFields(leagueExternalId: string): Promise<Field[]> {
    const ucResponse = await this.fields.list({
      event_id: Number(leagueExternalId),
    });

    // Group UC fields by venue (for now, each UC field becomes a subfield)
    // Later we can implement more sophisticated venue grouping logic
    const venueMap = new Map<string, UCField[]>();

    ucResponse.result.forEach((ucField) => {
      // Extract venue name from field name or use field name as fallback
      const venueName = this.extractVenueName(ucField.name) || ucField.name;

      if (!venueMap.has(venueName)) {
        venueMap.set(venueName, []);
      }
      venueMap.get(venueName)!.push(ucField);
    });

    // Transform to our domain model
    const fields: Field[] = [];
    venueMap.forEach((ucFields, venueName) => {
      const primaryField = ucFields[0];

      // Determine if this venue has subfields or is a single field
      const hasSubfields = ucFields.length > 1 ||
        (ucFields.length === 1 && this.extractVenueName(ucFields[0].name) !== null);

      const subfields = hasSubfields
        ? ucFields.map((ucField) => ({
            id: ucField.id.toString(),
            name: ucField.name,
            surface: ucField.surface,
            externalRefs: {
              uc: {
                eventId: Number(leagueExternalId),
                orgId: ucField.organization_id,
                slug: ucField.slug,
              },
            },
            meta: {
              contactPhone: ucField.contact_phone_number,
            },
          }))
        : []; // No subfields for single venues

      fields.push({
        id: `venue-${primaryField.organization_id}-${venueName.replace(/\s+/g, '-').toLowerCase()}`,
        name: venueName,
        venue: venueName,
        subfields,
        map: primaryField.website_url,
      });
    });

    return fields;
  }

  private extractVenueName(fieldName: string): string | null {
    // Try to extract venue name from field name
    // Common patterns: "Venue Name - Field Name", "Venue Name Field N"
    const patterns = [
      /^(.+?)\s*-\s*.+$/, // "Venue - Field"
      /^(.+?)\s+Field\s+\d+$/, // "Venue Field N"
      /^(.+?)\s+Pitch\s*\d*$/, // "Venue Pitch N"
    ];

    for (const pattern of patterns) {
      const match = fieldName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // If no pattern matches, return the first part before common field indicators
    // Only if they clearly indicate a field subdivision (i.e., followed by a number or letter)
    const fieldIndicators = [
      { indicator: 'Field', pattern: /^(.+?)\s+Field\s+[A-Z0-9]/i },
      { indicator: 'Pitch', pattern: /^(.+?)\s+Pitch\s+[A-Z0-9]/i },
      { indicator: 'Court', pattern: /^(.+?)\s+Court\s+[A-Z0-9]/i },
    ];

    for (const { pattern } of fieldIndicators) {
      const match = fieldName.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    // If the field name ends with just "Field", "Pitch", or "Court" without subdivision,
    // treat the entire name as the venue
    return null;
  }

  /** Get current user from UC. */
  async getCurrentUser(): Promise<UserProfile | null> {
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
            '20'?: string;
            '40'?: string;
            '200'?: string;
            '280'?: string;
            '370'?: string;
          };
          teams?: Array<{
            id: number;
            name: string;
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

      // Map gender identification to our simplified format
      const mapGenderIdentification = (
        genderValue: string,
      ): UserProfile['identifies'] => {
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
      const pastTeams = (ucUser.teams || []).map(
        (team: { id: number; name: string; created_at: string }) => ({
          id: team.id.toString(),
          name: team.name,
          colour: '#000000',
          altColour: '#ffffff',
          dateJoined: team.created_at,
          monthYear: this.formatMonthYear(team.created_at),
        }),
      );

      const userProfile: UserProfile = {
        email: ucUser.email_address || '',
        firstName: ucUser.first_name || '',
        lastName: ucUser.last_name || '',
        integration: 'uc',
        pastTeams,
        lastLogin: ucUser.last_seen || '',
        identifies: mapGenderIdentification(ucUser.gender || ''),
        avatarSmall: ucUser.images?.['40'],
        avatarLarge: ucUser.images?.['370'],
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
        year: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  }
}
