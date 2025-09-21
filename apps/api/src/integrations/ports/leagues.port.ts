export interface LeagueSummary {
  id: string; // domain id (string OK for portability)
  name: string;
  start?: string; // ISO date
  end?: string;
  provider?: string; // 'uc' | future
  externalId?: string; // provider-native id
}

export interface LeagueListOptions {
  limit?: number;
  order_by?: string;
  start?: string; // 'all' | 'current' | 'future' | 'ongoing'
}

export interface ILeagueProvider {
  listRecent(options?: LeagueListOptions): Promise<LeagueSummary[]>;
  getLeagueById(id: string): Promise<LeagueSummary | null>; // domain or pass-through
}
