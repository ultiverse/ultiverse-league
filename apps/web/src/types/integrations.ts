import { IntegrationProvider } from '../api/integrations';
import {
  SyncOperation as BaseSyncOperation,
  ConflictResolution as BaseConflictResolution,
  SyncPreview as BaseSyncPreview,
} from '@ultiverse/shared-types';

// Frontend-specific integration connection that uses the full provider object
export interface IntegrationConnection {
    provider: IntegrationProvider;
    isConnected: boolean;
    connectedEmail?: string;
    connectedAt?: string;
    lastSyncAt?: string;
    status: 'connected' | 'disconnected' | 'error' | 'pending';
    errorMessage?: string;
}

// Frontend-specific sync operation that uses the full provider object
export interface SyncOperation extends Omit<BaseSyncOperation, 'provider'> {
    provider: IntegrationProvider;
}

// Frontend-specific sync preview that uses the full provider object
export interface SyncPreview extends Omit<BaseSyncPreview, 'provider'> {
    provider: IntegrationProvider;
}

// Re-export types that don't need frontend customization
export type { BaseConflictResolution as ConflictResolution };