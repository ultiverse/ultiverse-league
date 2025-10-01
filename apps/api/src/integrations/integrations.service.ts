import { Injectable } from '@nestjs/common';
import {
  IntegrationProvider,
  IntegrationConnection,
  ConnectResponse,
  DisconnectResponse,
  RefreshResponse,
} from '@ultiverse/shared-types';

@Injectable()
export class IntegrationsService {
  // In-memory storage for demo purposes
  // In production, this would be stored in a database
  private connections: Map<string, IntegrationConnection> = new Map();

  constructor() {
    // Initialize with default connection states
    this.connections.set('uc', {
      provider: 'uc',
      isConnected: true, // UC is connected by default for now
      status: 'connected',
      connectedEmail: 'user@example.com',
      connectedAt: new Date().toISOString(),
      lastSyncAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
    });

    this.connections.set('zuluru', {
      provider: 'zuluru',
      isConnected: false,
      status: 'disconnected',
    });
  }

  /**
   * Get list of available integration providers
   */
  getAvailableProviders(): IntegrationProvider[] {
    return [
      {
        provider: 'uc',
        name: 'Ultimate Central',
        description: 'Your ultimate frisbee league management platform. Sync teams, games, and player data.',
        iconText: 'UC',
        primaryColor: '#1976d2',
        features: ['Teams', 'Games', 'Players', 'League Info'],
        authType: 'oauth',
        isAvailable: true,
      },
      {
        provider: 'zuluru',
        name: 'Zuluru',
        description: 'Connect with Zuluru league management system.',
        iconText: 'ZU',
        primaryColor: '#4caf50',
        features: ['Teams', 'Schedules', 'Registration'],
        authType: 'api_key',
        isAvailable: false, // Coming soon
      },
    ];
  }

  /**
   * Get current connection status for all providers
   */
  getConnections(): IntegrationConnection[] {
    return Array.from(this.connections.values());
  }

  /**
   * Connect to a provider
   */
  async connectProvider(provider: string): Promise<ConnectResponse> {
    const connection = this.connections.get(provider);

    if (!connection) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    // Simulate OAuth flow for UC
    if (provider === 'uc') {
      // In a real implementation, this would:
      // 1. Generate OAuth state
      // 2. Return authorization URL
      // 3. Handle callback to complete the flow

      // For now, simulate successful connection
      await this.simulateAsync(1000);

      this.connections.set(provider, {
        ...connection,
        isConnected: true,
        status: 'connected',
        connectedEmail: 'user@example.com',
        connectedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: 'Successfully connected to Ultimate Central',
        redirectUrl: undefined, // In OAuth flow, this would be the auth URL
      };
    }

    // For other providers
    if (provider === 'zuluru') {
      throw new Error('Zuluru integration is not yet available');
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Disconnect from a provider
   */
  async disconnectProvider(provider: string): Promise<DisconnectResponse> {
    const connection = this.connections.get(provider);

    if (!connection) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Provider ${provider} is not connected`);
    }

    // Simulate disconnection process
    await this.simulateAsync(500);

    this.connections.set(provider, {
      ...connection,
      isConnected: false,
      status: 'disconnected',
      connectedEmail: undefined,
      connectedAt: undefined,
      lastSyncAt: undefined,
      errorMessage: undefined,
    });

    return {
      success: true,
      message: `Successfully disconnected from ${provider}`,
    };
  }

  /**
   * Refresh connection for a provider
   */
  async refreshConnection(provider: string): Promise<RefreshResponse> {
    const connection = this.connections.get(provider);

    if (!connection) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Provider ${provider} is not connected`);
    }

    // Simulate refresh process
    await this.simulateAsync(800);

    // Update last sync time
    this.connections.set(provider, {
      ...connection,
      lastSyncAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Successfully refreshed connection to ${provider}`,
    };
  }

  /**
   * Get connection status for a specific provider
   */
  getConnection(provider: string): IntegrationConnection | undefined {
    return this.connections.get(provider);
  }

  /**
   * Check if a provider is connected
   */
  isProviderConnected(provider: string): boolean {
    const connection = this.connections.get(provider);
    return connection?.isConnected ?? false;
  }

  /**
   * Simulate async operation with delay
   */
  private async simulateAsync(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}