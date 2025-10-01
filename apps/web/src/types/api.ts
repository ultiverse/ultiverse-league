export type DataSource = 'ultiverse' | 'uc' | 'zuluru' | 'both';
export type SyncStatus = 'synced' | 'needs_pull' | 'needs_push' | 'conflict' | 'never_synced';
export type IntegrationProvider = 'uc' | 'zuluru';

export interface LeagueSummary {
    id: string;
    name: string;
    start?: string;
    end?: string;
    provider?: string;
    externalId?: string;
    source: DataSource;
    lastSynced?: string | null;
    syncStatus: SyncStatus;
    integrationProvider?: IntegrationProvider;
}

export interface TeamSummary {
    id: string;
    name: string;
    division?: string | null;
    colour: string;
    altColour: string;
    dateJoined?: string;
    monthYear?: string;
    photoUrl?: string | null;
    source: DataSource;
    lastSynced?: string | null;
    syncStatus: SyncStatus;
    integrationProvider?: IntegrationProvider;
}

export interface GenerateScheduleRequest {
    pods: string[];
    rounds: number;
    recencyWindow?: number;
    pairingMode?: 'each-vs-both' | 'single';
    names?: Record<string, string>;
    leagueId?: string;
}