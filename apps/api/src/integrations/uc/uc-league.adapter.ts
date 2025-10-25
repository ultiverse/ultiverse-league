import { Injectable, Logger } from '@nestjs/common';
import { UCClient } from './uc.client';
import { UCEventsService } from './uc.events/uc.events.service';
import { UCTeamsService } from './uc.teams/uc.teams.service';
import {
  LeagueAdapter,
  LeagueKey,
  ExternalLeague,
  ExternalTeam,
  ExternalPlayer,
} from '../../imports/ports/league-adapter.interface';
import { UCStartParam } from '@ultiverse/shared-types';

interface UCTeamWithColor {
  id: number;
  name: string;
  color?: string;
  colour?: string;
  alt_colour?: string;
  [key: string]: unknown;
}

@Injectable()
export class UCLeagueAdapter implements LeagueAdapter {
  private readonly logger = new Logger(UCLeagueAdapter.name);

  constructor(
    private readonly client: UCClient,
    private readonly events: UCEventsService,
    private readonly teams: UCTeamsService,
  ) {}

  async fetchLeague(leagueKey: LeagueKey): Promise<ExternalLeague> {
    const eventId = Number(leagueKey.externalId);
    this.logger.log(
      `Fetching league ${leagueKey.externalId} (eventId: ${eventId}) from UC`,
    );

    const event = await this.events.getById(eventId);

    if (!event) {
      throw new Error(`League ${leagueKey.externalId} not found in UC`);
    }

    return {
      externalId: event.id.toString(),
      name: event.name,
      seasonStart: event.start ? new Date(event.start) : undefined,
      seasonEnd: event.end ? new Date(event.end) : undefined,
      rawData: event,
    };
  }

  async fetchTeams(leagueKey: LeagueKey): Promise<ExternalTeam[]> {
    const eventId = Number(leagueKey.externalId);
    this.logger.log(
      `Fetching teams for league ${leagueKey.externalId} (eventId: ${eventId}) from UC`,
    );

    // Use UCTeamsService to fetch teams for this event
    const response = await this.teams.list({
      event_id: eventId,
    });

    if (!response?.result) {
      this.logger.warn(`No teams found for league ${leagueKey.externalId}`);
      return [];
    }

    return response.result.map((team) => {
      const teamWithColor = team as UCTeamWithColor;
      return {
        externalId: team.id.toString(),
        name: team.name,
        colour: teamWithColor.color ?? '#000000', // UC uses American spelling
        altColour: '#ffffff', // UC doesn't provide altColour
        rawData: team,
      };
    });
  }

  fetchPlayers(teamExtId: string): Promise<ExternalPlayer[]> {
    this.logger.log(`Fetching roster for team ${teamExtId} from UC`);

    // TODO: Implement when UC roster endpoint is known
    // For now, return empty array
    this.logger.warn('fetchPlayers not yet implemented for UC');
    return Promise.resolve([]);
  }

  async listMyLeagues(): Promise<ExternalLeague[]> {
    this.logger.log('Fetching organization leagues from UC /api/events');

    // Fetch all recent league-type events
    // Use 'all' to get all leagues (past, current, and future)
    const response = await this.events.list({
      start: 'all' as UCStartParam,
      type: ['league'],
      order_by: 'date_desc',
      per_page: 100, // Get up to 100 recent leagues
    });

    if (!response?.result || response.result.length === 0) {
      this.logger.log('No leagues found in UC');
      return [];
    }

    const leagues: ExternalLeague[] = response.result.map((event) => ({
      externalId: event.id.toString(),
      name: event.name,
      seasonStart: event.start ? new Date(event.start) : undefined,
      seasonEnd: event.end ? new Date(event.end) : undefined,
      rawData: event,
    }));

    this.logger.log(`Found ${leagues.length} leagues from organization`);
    return leagues;
  }
}
