/**
 * Integration provider definition
 */
export interface IntegrationProvider {
  provider: string;
  name: string;
  description: string;
  iconText: string;
  primaryColor: string;
  features: string[];
  authType: 'oauth' | 'api_key';
  isAvailable: boolean;
}

/**
 * Integration connection status
 */
export interface IntegrationConnection {
  provider: string;
  isConnected: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  connectedEmail?: string;
  connectedAt?: string;
  lastSyncAt?: string;
  errorMessage?: string;
}

/**
 * Response types for integration operations
 */
export interface ConnectResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

export interface DisconnectResponse {
  success: boolean;
  message: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
}

/**
 * Sync operation tracking
 */
export interface SyncOperation {
  id: string;
  type: 'pull' | 'push';
  provider: string;
  entity: 'leagues' | 'teams' | 'games' | 'players' | 'fields';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  itemsProcessed?: number;
  totalItems?: number;
  errorMessage?: string;
}

/**
 * Conflict resolution data
 */
export interface ConflictResolution {
  entityType: 'league' | 'team' | 'game' | 'player' | 'field';
  entityId: string;
  fieldName: string;
  localValue: unknown;
  remoteValue: unknown;
  resolution: 'keep_local' | 'keep_remote' | 'merge' | 'skip';
}

/**
 * Sync preview summary
 */
export interface SyncPreview {
  provider: string;
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