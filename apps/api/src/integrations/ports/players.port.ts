/**
 * Port for discovering players/rosters from external providers
 */

export interface PlayerRosterItem {
  externalPlayerId: string;
  externalTeamId: string;
  internalTeamId?: string; // Mapped to internal team ID
  fullName?: string;
  email?: string;
  rawData: Record<string, unknown>;
}

export interface IPlayersProvider {
  /**
   * Fetch all players for a league
   * Provider should map external team IDs to internal team IDs if possible
   */
  listPlayersForLeague(leagueId: string): Promise<PlayerRosterItem[]>;
}

export const PLAYERS_PROVIDER = Symbol('PLAYERS_PROVIDER');
