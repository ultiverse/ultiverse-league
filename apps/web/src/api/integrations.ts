import { api } from './client';
import {
  IntegrationProvider,
  IntegrationConnection as ApiIntegrationConnection,
  ConnectResponse,
  DisconnectResponse,
  RefreshResponse,
} from '@ultiverse/shared-types';

// Re-export types for convenience
export type { IntegrationProvider, ApiIntegrationConnection, ConnectResponse, DisconnectResponse, RefreshResponse };

/**
 * Get list of available integration providers
 */
export const getIntegrationProviders = () =>
  api<IntegrationProvider[]>('/integrations/providers');

/**
 * Get current connection status for all providers
 */
export const getIntegrationConnections = () =>
  api<ApiIntegrationConnection[]>('/integrations/connections');

/**
 * Connect to a specific provider
 */
export const connectIntegrationProvider = (provider: string, connectionData?: unknown) =>
  api<ConnectResponse>(`/integrations/connect/${provider}`, {
    method: 'POST',
    body: connectionData ? JSON.stringify(connectionData) : undefined,
  });

/**
 * Disconnect from a specific provider
 */
export const disconnectIntegrationProvider = (provider: string) =>
  api<DisconnectResponse>(`/integrations/disconnect/${provider}`, {
    method: 'DELETE',
  });

/**
 * Refresh connection for a specific provider
 */
export const refreshIntegrationProvider = (provider: string) =>
  api<RefreshResponse>(`/integrations/refresh/${provider}`, {
    method: 'POST',
  });