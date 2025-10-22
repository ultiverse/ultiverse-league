export interface MeLeague {
  id: string;
  organization: {
    id: string;
    name: string;
  };
  name: string;
  seasonStart?: string;
  seasonEnd?: string;
  source: 'ultiverse' | 'ultimate_central' | 'zuluru';
  badge: 'UV' | 'UC' | 'Z';
  lastSyncedAt?: string;
  syncStatus?: string;
  roles: string[];
}

export interface MeConnection {
  provider: string;
  status: 'active' | 'not_connected';
  connectedEmail?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}

export interface MeLeaguesResponse {
  leagues: MeLeague[];
  connections: MeConnection[];
}

export async function getMyLeagues(fresh?: 'if-stale' | 'force'): Promise<MeLeaguesResponse> {
  const url = fresh ? `/user/me/leagues?fresh=${fresh}` : '/user/me/leagues';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch leagues: ${response.statusText}`);
  }

  return response.json();
}
