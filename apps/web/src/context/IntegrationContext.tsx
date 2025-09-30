import { createContext, useState, useEffect, ReactNode } from 'react';
import { IntegrationConnection, IntegrationConfig, SyncOperation } from '../types/integrations';
import { IntegrationProvider } from '../types/api';
import { AVAILABLE_INTEGRATIONS } from '../constants/integrations';

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


interface IntegrationContextProviderProps {
    children: ReactNode;
}

export function IntegrationContextProvider({ children }: IntegrationContextProviderProps) {
    const [connections, setConnections] = useState<IntegrationConnection[]>([]);
    const [activeSyncOperations, setActiveSyncOperations] = useState<SyncOperation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize with default connection states
    useEffect(() => {
        const initializeConnections = () => {
            const defaultConnections: IntegrationConnection[] = AVAILABLE_INTEGRATIONS.map(integration => ({
                provider: integration.provider,
                isConnected: integration.provider === 'uc', // UC is connected by default for now
                connectedEmail: integration.provider === 'uc' ? 'user@example.com' : undefined,
                connectedAt: integration.provider === 'uc' ? new Date().toISOString() : undefined,
                status: integration.provider === 'uc' ? 'connected' : 'disconnected',
            }));

            setConnections(defaultConnections);
            setIsLoading(false);
        };

        initializeConnections();
    }, []);

    const connectProvider = async (provider: IntegrationProvider): Promise<void> => {
        setIsLoading(true);
        try {
            // TODO: Implement actual OAuth/API key connection logic
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

            setConnections(prev => prev.map(conn =>
                conn.provider === provider
                    ? {
                        ...conn,
                        isConnected: true,
                        connectedEmail: 'user@example.com',
                        connectedAt: new Date().toISOString(),
                        status: 'connected' as const,
                    }
                    : conn
            ));
        } catch {
            setConnections(prev => prev.map(conn =>
                conn.provider === provider
                    ? { ...conn, status: 'error' as const, errorMessage: 'Connection failed' }
                    : conn
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectProvider = async (provider: IntegrationProvider): Promise<void> => {
        setIsLoading(true);
        try {
            // TODO: Implement actual disconnection logic
            await new Promise(resolve => setTimeout(resolve, 500));

            setConnections(prev => prev.map(conn =>
                conn.provider === provider
                    ? {
                        ...conn,
                        isConnected: false,
                        connectedEmail: undefined,
                        connectedAt: undefined,
                        status: 'disconnected' as const,
                        errorMessage: undefined,
                    }
                    : conn
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const refreshConnection = async (provider: IntegrationProvider): Promise<void> => {
        // TODO: Implement connection refresh logic
        console.log('Refreshing connection for', provider);
    };

    const startSync = async (provider: IntegrationProvider, type: 'pull' | 'push'): Promise<string> => {
        const operationId = `sync_${provider}_${type}_${Date.now()}`;
        const operation: SyncOperation = {
            id: operationId,
            type,
            provider,
            entity: 'teams', // TODO: Make this configurable
            status: 'pending',
            startedAt: new Date().toISOString(),
        };

        setActiveSyncOperations(prev => [...prev, operation]);

        // TODO: Implement actual sync logic
        setTimeout(() => {
            setActiveSyncOperations(prev => prev.map(op =>
                op.id === operationId
                    ? { ...op, status: 'completed' as const, completedAt: new Date().toISOString() }
                    : op
            ));
        }, 3000);

        return operationId;
    };

    const getSyncStatus = (operationId: string): SyncOperation | undefined => {
        return activeSyncOperations.find(op => op.id === operationId);
    };

    const isProviderConnected = (provider: IntegrationProvider): boolean => {
        const connection = connections.find(conn => conn.provider === provider);
        return connection?.isConnected ?? false;
    };

    const getProviderConnection = (provider: IntegrationProvider): IntegrationConnection | undefined => {
        return connections.find(conn => conn.provider === provider);
    };

    return (
        <IntegrationContext.Provider value={{
            connections,
            availableIntegrations: AVAILABLE_INTEGRATIONS,
            activeSyncOperations,
            isLoading,
            connectProvider,
            disconnectProvider,
            refreshConnection,
            startSync,
            getSyncStatus,
            isProviderConnected,
            getProviderConnection,
        }}>
            {children}
        </IntegrationContext.Provider>
    );
}

