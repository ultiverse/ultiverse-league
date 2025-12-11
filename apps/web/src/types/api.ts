import { DATA_SOURCES, PROVIDERS } from '@ultiverse/shared-types';

export type DataSource = typeof DATA_SOURCES[keyof typeof DATA_SOURCES];
export type SyncStatus = 'synced' | 'needs_pull' | 'needs_push' | 'conflict' | 'never_synced';
export type IntegrationProvider = typeof PROVIDERS.ULTIMATE_CENTRAL | typeof PROVIDERS.ZULURU;

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
    playerCount?: number;
    source: DataSource;
    lastSynced?: string | null;
    syncStatus: SyncStatus;
    integrationProvider?: IntegrationProvider;
}

export interface ExternalSource {
    id: string;
    provider: string;
    externalId: string;
    lastSyncedAt?: string;
    rawData?: Record<string, unknown>;
}

export interface TeamDetail {
    id: string;
    name: string;
    leagueId: string;
    division?: string | null;
    colour?: string | null;
    altColour?: string | null;
    photoUrl?: string | null;
    location?: string | null;
    createdAt: string;
    updatedAt: string;
    externalSources?: ExternalSource[];
}

export interface TeamPlayer {
    id: string;
    playerId: string;
    fullName?: string;
    primaryEmail?: string;
    role: 'player' | 'captain' | 'coach';
    joinedVia: 'manual' | 'uc_import' | 'zuluru_import';
    externalSources?: ExternalSource[];
}

export interface GenerateScheduleRequest {
    pods: string[];
    rounds: number;
    recencyWindow?: number;
    pairingMode?: 'each-vs-both' | 'single';
    names?: Record<string, string>;
    leagueId?: string;
}