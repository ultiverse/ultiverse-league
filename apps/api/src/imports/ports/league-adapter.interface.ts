/**
 * Adapter interface for importing leagues from external providers
 * Each provider (UC, Zuluru, etc.) implements this interface
 */

export interface LeagueKey {
  provider: string;
  externalId: string;
}

export interface ExternalLeague {
  externalId: string;
  name: string;
  seasonStart?: Date;
  seasonEnd?: Date;
  rawData: Record<string, unknown>;
}

export interface ExternalTeam {
  externalId: string;
  name: string;
  location?: string;
  colour?: string;
  altColour?: string;
  rawData: Record<string, unknown>;
}

export interface ExternalPlayer {
  externalId: string;
  email?: string;
  fullName?: string;
  rawData: Record<string, unknown>;
}

export interface LeagueAdapter {
  /**
   * Fetch league details from external provider
   */
  fetchLeague(leagueKey: LeagueKey): Promise<ExternalLeague>;

  /**
   * Fetch all teams in a league
   */
  fetchTeams(leagueKey: LeagueKey): Promise<ExternalTeam[]>;

  /**
   * Fetch roster for a specific team
   */
  fetchPlayers(teamExtId: string): Promise<ExternalPlayer[]>;

  /**
   * List leagues accessible to the current user
   */
  listMyLeagues(): Promise<ExternalLeague[]>;
}

export const LEAGUE_ADAPTER = Symbol('LEAGUE_ADAPTER');
