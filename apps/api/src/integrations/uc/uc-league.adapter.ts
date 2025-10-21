import { Injectable, Logger } from '@nestjs/common';
import { UCClient } from './uc.client';
import {
  LeagueAdapter,
  LeagueKey,
  ExternalLeague,
  ExternalTeam,
  ExternalPlayer,
} from '../../imports/ports/league-adapter.interface';

interface UCEvent {
  id: number;
  name: string;
  open: string; // ISO date
  close: string; // ISO date
  [key: string]: unknown;
}

interface UCTeam {
  id: number;
  name: string;
  colour?: string;
  alt_colour?: string;
  [key: string]: unknown;
}

interface UCEventsResponse {
  action: string;
  status: number;
  count: number;
  result: UCEvent[];
}

interface UCTeamsResponse {
  action: string;
  status: number;
  count: number;
  result: UCTeam[];
}

@Injectable()
export class UCLeagueAdapter implements LeagueAdapter {
  private readonly logger = new Logger(UCLeagueAdapter.name);

  constructor(private readonly client: UCClient) {}

  async fetchLeague(leagueKey: LeagueKey): Promise<ExternalLeague> {
    this.logger.log(`Fetching league ${leagueKey.externalId} from UC`);

    const response = await this.client.get<{ result: UCEvent[] }>(
      `/api/events/${leagueKey.externalId}`,
    );

    if (!response?.result?.[0]) {
      throw new Error(`League ${leagueKey.externalId} not found in UC`);
    }

    const event = response.result[0];

    return {
      externalId: event.id.toString(),
      name: event.name,
      seasonStart: event.open ? new Date(event.open) : undefined,
      seasonEnd: event.close ? new Date(event.close) : undefined,
      rawData: event,
    };
  }

  async fetchTeams(leagueKey: LeagueKey): Promise<ExternalTeam[]> {
    this.logger.log(`Fetching teams for league ${leagueKey.externalId} from UC`);

    // UC API endpoint for teams in an event
    const response = await this.client.get<UCTeamsResponse>(
      `/api/events/${leagueKey.externalId}/teams`,
    );

    if (!response?.result) {
      this.logger.warn(`No teams found for league ${leagueKey.externalId}`);
      return [];
    }

    return response.result.map((team) => ({
      externalId: team.id.toString(),
      name: team.name,
      colour: team.colour || '#000000',
      altColour: team.alt_colour || '#ffffff',
      rawData: team,
    }));
  }

  async fetchPlayers(teamExtId: string): Promise<ExternalPlayer[]> {
    this.logger.log(`Fetching roster for team ${teamExtId} from UC`);

    // TODO: Implement when UC roster endpoint is known
    // For now, return empty array
    this.logger.warn('fetchPlayers not yet implemented for UC');
    return [];
  }

  async listMyLeagues(): Promise<ExternalLeague[]> {
    this.logger.log('Fetching user leagues from UC /api/persons/me');

    interface UCPersonsResponse {
      action: string;
      status: number;
      count: number;
      result: Array<{
        id: number;
        teams?: Array<{
          id: number;
          event?: UCEvent;
          [key: string]: unknown;
        }>;
      }>;
    }

    const response = await this.client.get<UCPersonsResponse>('/api/persons/me');

    if (!response?.result?.[0]?.teams) {
      this.logger.log('No teams found for user in UC');
      return [];
    }

    const teams = response.result[0].teams;

    // Extract unique events from teams
    const eventsMap = new Map<number, UCEvent>();
    for (const team of teams) {
      if (team.event) {
        eventsMap.set(team.event.id, team.event);
      }
    }

    const leagues: ExternalLeague[] = Array.from(eventsMap.values()).map(
      (event) => ({
        externalId: event.id.toString(),
        name: event.name,
        seasonStart: event.open ? new Date(event.open) : undefined,
        seasonEnd: event.close ? new Date(event.close) : undefined,
        rawData: event,
      }),
    );

    this.logger.log(`Found ${leagues.length} leagues for user`);
    return leagues;
  }
}
