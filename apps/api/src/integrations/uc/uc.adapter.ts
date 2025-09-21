import { Injectable } from '@nestjs/common';

import type { ILeagueProvider, LeagueSummary, LeagueListOptions } from '../ports/leagues.port';
import type {
  IRegistrationProvider,
  Registration,
} from '../ports/registrations.port';
import type { ITeamsProvider, TeamSummary } from '../ports/teams.port';
import type { IGamesProvider, GameSummary } from '../ports/games.port';

import { UCEventsService } from './uc.events/uc.events.service';
import { UCRegistrationsService } from './uc.registrations/uc.registrations.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';
import { UCGamesService } from './uc.games/uc.games.service';

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
    IGamesProvider
{
  constructor(
    private readonly events: UCEventsService,
    private readonly regs: UCRegistrationsService,
    private readonly teams: UCTeamsService,
    private readonly games: UCGamesService,
  ) {}

  /** List recent/current league-like events from UC. */
  async listRecent(options?: LeagueListOptions): Promise<LeagueSummary[]> {
    // Default to 'all' to show more leagues for testing, but allow override
    const res = await this.events.list({
      start: (options?.start as any) || 'all',
      type: ['league'],
      order_by: (options?.order_by as any) || 'date_desc',
      per_page: options?.limit || 20 // Show up to 20 recent leagues by default
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
}
