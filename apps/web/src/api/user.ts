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
  const url = fresh ? `/api/v1/user/me/leagues?fresh=${fresh}` : '/api/v1/user/me/leagues';
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch leagues: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all discovered leagues for the organization (org-level admin view)
 * This returns all leagues that have been discovered via integrations,
 * regardless of whether the user has team memberships
 */
export async function getAllLeagues(): Promise<MeLeague[]> {
  // Get user email from session storage for authentication
  const email = sessionStorage.getItem('ultiverse_user_email');
  const headers: HeadersInit = {};

  if (email) {
    headers['X-User-Email'] = email;
  }

  const response = await fetch('/api/v1/leagues', { headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch leagues: ${response.statusText}`);
  }

  return response.json();
}
