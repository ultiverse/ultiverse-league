import { useState, useEffect, ReactNode } from 'react';
import { IntegrationConnection, SyncOperation } from '../types/integrations';
import { IntegrationContext } from './IntegrationContext.context';
import {
  getIntegrationProviders,
  getIntegrationConnections,
  connectIntegrationProvider,
  disconnectIntegrationProvider,
  refreshIntegrationProvider,
  ApiIntegrationConnection,
  IntegrationProvider,
} from '../api/integrations';


interface IntegrationContextProviderProps {
    children: ReactNode;
}

// Transform API connection to frontend format
const transformApiConnection = (apiConnection: ApiIntegrationConnection, providers: IntegrationProvider[]): IntegrationConnection => {
    const provider = providers.find(p => p.provider === apiConnection.provider);
    if (!provider) {
        throw new Error(`Unknown provider: ${apiConnection.provider}`);
    }

    return {
        provider,
        isConnected: apiConnection.isConnected,
        status: apiConnection.status,
        connectedEmail: apiConnection.connectedEmail,
        connectedAt: apiConnection.connectedAt,
        lastSyncAt: apiConnection.lastSyncAt,
        errorMessage: apiConnection.errorMessage,
    };
};

export function IntegrationContextProvider({ children }: IntegrationContextProviderProps) {
    const [connections, setConnections] = useState<IntegrationConnection[]>([]);
    const [availableIntegrations, setAvailableIntegrations] = useState<IntegrationProvider[]>([]);
    const [activeSyncOperations, setActiveSyncOperations] = useState<SyncOperation[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load integrations and connections from API
    useEffect(() => {
        const initializeIntegrations = async () => {
            try {
                setIsLoading(true);

                // Load available providers and current connections in parallel
                const [providers, apiConnections] = await Promise.all([
                    getIntegrationProviders(),
                    getIntegrationConnections(),
                ]);

                setAvailableIntegrations(providers);

                // Transform API connections to frontend format
                const transformedConnections = apiConnections.map(conn =>
                    transformApiConnection(conn, providers)
                );
                setConnections(transformedConnections);
            } catch (error) {
                console.error('Failed to initialize integrations:', error);
                // Fall back to empty state on error
                setAvailableIntegrations([]);
                setConnections([]);
            } finally {
                setIsLoading(false);
            }
        };

        initializeIntegrations();
    }, []);

    const connectProvider = async (provider: IntegrationProvider): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await connectIntegrationProvider(provider.provider);

            if (response.success) {
                // Refresh connections after successful connection
                const apiConnections = await getIntegrationConnections();
                const transformedConnections = apiConnections.map(conn =>
                    transformApiConnection(conn, availableIntegrations)
                );
                setConnections(transformedConnections);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Connection failed';
            setConnections(prev => prev.map(conn =>
                conn.provider.provider === provider.provider
                    ? { ...conn, status: 'error' as const, errorMessage }
                    : conn
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectProvider = async (provider: IntegrationProvider): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await disconnectIntegrationProvider(provider.provider);

            if (response.success) {
                // Refresh connections after successful disconnection
                const apiConnections = await getIntegrationConnections();
                const transformedConnections = apiConnections.map(conn =>
                    transformApiConnection(conn, availableIntegrations)
                );
                setConnections(transformedConnections);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Disconnection failed';
            setConnections(prev => prev.map(conn =>
                conn.provider.provider === provider.provider
                    ? { ...conn, status: 'error' as const, errorMessage }
                    : conn
            ));
        } finally {
            setIsLoading(false);
        }
    };

    const refreshConnection = async (provider: IntegrationProvider): Promise<void> => {
        try {
            const response = await refreshIntegrationProvider(provider.provider);

            if (response.success) {
                // Refresh connections after successful refresh
                const apiConnections = await getIntegrationConnections();
                const transformedConnections = apiConnections.map(conn =>
                    transformApiConnection(conn, availableIntegrations)
                );
                setConnections(transformedConnections);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Failed to refresh connection:', error);
        }
    };

    const startSync = async (provider: IntegrationProvider, type: 'pull' | 'push'): Promise<string> => {
        const operationId = `sync_${provider.provider}_${type}_${Date.now()}`;
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
        const connection = connections.find(conn => conn.provider.provider === provider.provider);
        return connection?.isConnected ?? false;
    };

    const getProviderConnection = (provider: IntegrationProvider): IntegrationConnection | undefined => {
        return connections.find(conn => conn.provider.provider === provider.provider);
    };

    return (
        <IntegrationContext.Provider value={{
            connections,
            availableIntegrations,
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

