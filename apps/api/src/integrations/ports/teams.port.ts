export interface TeamSummary {
  id: string;
  name: string;
  division?: string | null;
}

export interface ITeamsProvider {
  listTeams(
    leagueExternalId: string,
    page?: number,
    perPage?: number,
  ): Promise<TeamSummary[]>;
}
