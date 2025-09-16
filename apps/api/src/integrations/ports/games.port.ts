export interface GameTeamRef {
  id?: string;
  name?: string;
}

export interface GameSummary {
  id: string;
  eventId?: string;
  date?: string | null;
  time?: string | null;
  status?: string;
  homeTeam?: GameTeamRef | null;
  awayTeam?: GameTeamRef | null;
}

export interface IGamesProvider {
  listGames(
    leagueExternalId: string,
    opts?: { page?: number; perPage?: number },
  ): Promise<GameSummary[]>;
}
