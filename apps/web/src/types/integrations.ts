import { IntegrationProvider } from './api';

export interface IntegrationConnection {
    provider: IntegrationProvider;
    isConnected: boolean;
    connectedEmail?: string;
    connectedAt?: string;
    lastSyncAt?: string;
    status: 'connected' | 'disconnected' | 'error' | 'pending';
    errorMessage?: string;
}

export interface IntegrationConfig {
    provider: IntegrationProvider;
    name: string;
    description: string;
    iconUrl?: string;
    iconText: string; // Fallback text like "UC" for Ultimate Central
    primaryColor: string;
    features: string[];
    authType: 'oauth' | 'api_key';
    isAvailable: boolean;
}

export interface SyncOperation {
    id: string;
    type: 'pull' | 'push';
    provider: IntegrationProvider;
    entity: 'leagues' | 'teams' | 'games' | 'players';
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    startedAt: string;
    completedAt?: string;
    itemsProcessed?: number;
    totalItems?: number;
    errorMessage?: string;
}

export interface ConflictResolution {
    entityType: 'league' | 'team' | 'game' | 'player';
    entityId: string;
    fieldName: string;
    localValue: unknown;
    remoteValue: unknown;
    resolution: 'keep_local' | 'keep_remote' | 'merge' | 'skip';
}

export interface SyncPreview {
    provider: IntegrationProvider;
    pullChanges: {
        new: number;
        updated: number;
        deleted: number;
    };
    pushChanges: {
        new: number;
        updated: number;
        deleted: number;
    };
    conflicts: ConflictResolution[];
}