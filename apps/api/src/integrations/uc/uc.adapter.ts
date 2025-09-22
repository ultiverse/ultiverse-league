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

import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';
import { UCGamesService } from './uc.games/uc.games.service';
import { UCClient } from './uc.client';
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
    IUserProvider
{
  constructor(
    private readonly events: UCEventsService,
    private readonly regs: UCRegistrationsService,
    private readonly teams: UCTeamsService,
    private readonly games: UCGamesService,
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
