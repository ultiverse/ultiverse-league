export interface TeamSummary {
  id: string;
  name: string;
  division?: string | null;
  colour: string; // Primary team color, defaults to black
  altColour: string; // Secondary team color, defaults to white
  dateJoined?: string; // ISO date (for past teams)
  monthYear?: string; // e.g., "June 2023" (for past teams)
  source: 'ultiverse' | 'ultimate_central' | 'zuluru'; // Data source
}

export interface ITeamsProvider {
  listTeams(
    leagueExternalId: string,
    page?: number,
    perPage?: number,
  ): Promise<TeamSummary[]>;
}
