export interface LeagueSummary {
  id: string; // domain id (string OK for portability)
  name: string;
  start?: string; // ISO date
  end?: string;
  provider?: string; // 'uc' | future
  externalId?: string; // provider-native id
}

export interface ILeagueProvider {
  listRecent(): Promise<LeagueSummary[]>;
  getLeagueById(id: string): Promise<LeagueSummary | null>; // domain or pass-through
}
