import { createContext } from 'react';
import { IntegrationConnection, IntegrationConfig, SyncOperation } from '../types/integrations';
import { IntegrationProvider } from '../types/api';

interface IntegrationContextType {
    connections: IntegrationConnection[];
    availableIntegrations: IntegrationConfig[];
    activeSyncOperations: SyncOperation[];
    isLoading: boolean;

    // Connection management
    connectProvider: (provider: IntegrationProvider) => Promise<void>;
    disconnectProvider: (provider: IntegrationProvider) => Promise<void>;
    refreshConnection: (provider: IntegrationProvider) => Promise<void>;

    // Sync operations
    startSync: (provider: IntegrationProvider, type: 'pull' | 'push') => Promise<string>;
    getSyncStatus: (operationId: string) => SyncOperation | undefined;

    // Utility functions
    isProviderConnected: (provider: IntegrationProvider) => boolean;
    getProviderConnection: (provider: IntegrationProvider) => IntegrationConnection | undefined;
}

export const IntegrationContext = createContext<IntegrationContextType | undefined>(undefined);