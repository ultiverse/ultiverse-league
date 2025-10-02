import { Injectable } from '@nestjs/common';
import {
  IntegrationProvider,
  IntegrationConnection as SharedIntegrationConnection,
  ConnectResponse,
  DisconnectResponse,
  RefreshResponse,
} from '@ultiverse/shared-types';
import { AccountsService } from './accounts.service';

@Injectable()
export class IntegrationsService {
  constructor(private readonly accountsService: AccountsService) {}

  /**
   * Get list of available integration providers
   */
  getAvailableProviders(): IntegrationProvider[] {
    return [
      {
        provider: 'uc',
        name: 'Ultimate Central',
        description:
          'Your ultimate frisbee league management platform. Sync teams, games, and player data.',
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
   * TODO: This should be scoped to authenticated user, for now using seeded account
   */
  async getConnections(): Promise<SharedIntegrationConnection[]> {
    // Use the seeded account for now - in real implementation this would be from authentication
    const account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      // Return empty array if no account found
      return [];
    }

    const connections = await this.accountsService.getIntegrationConnections(account.id);

    return connections.map(conn => ({
      provider: conn.provider,
      isConnected: conn.isConnected,
      status: conn.status,
      connectedEmail: conn.connectedEmail,
      connectedAt: conn.connectedAt?.toISOString(),
      lastSyncAt: conn.lastSyncAt?.toISOString(),
      errorMessage: conn.errorMessage,
    }));
  }

  /**
   * Connect to a provider
   * TODO: This should be scoped to authenticated user, for now using seeded account
   */
  async connectProvider(provider: string, connectionData?: any): Promise<ConnectResponse> {
    // Use the seeded account for now - in real implementation this would be from authentication
    let account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      throw new Error('User account not found. Please ensure you are logged in.');
    }

    // Validate provider
    const availableProviders = this.getAvailableProviders();
    const providerConfig = availableProviders.find(p => p.provider === provider);

    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!providerConfig.isAvailable) {
      throw new Error(`${providerConfig.name} integration is not yet available`);
    }

    // Check if already connected
    const existingConnection = await this.getConnection(provider);
    if (existingConnection?.isConnected) {
      return {
        success: true,
        message: `Already connected to ${providerConfig.name}`,
        redirectUrl: undefined,
      };
    }

    // Handle OAuth flow for UC
    if (provider === 'uc') {
      // Validate OAuth credentials if provided
      if (connectionData && connectionData.clientId && connectionData.clientSecret) {
        console.log('Received OAuth credentials for UC:', {
          clientId: connectionData.clientId,
          clientSecret: '***hidden***'
        });

        // In a real implementation, this would:
        // 1. Validate OAuth credentials with UC
        // 2. Generate OAuth state
        // 3. Return authorization URL
        // 4. Handle callback to complete the flow

        // For now, simulate successful connection with provided credentials
        await this.simulateAsync(1000);

        // Update database connection with OAuth credentials
        await this.accountsService.updateIntegrationConnection(account.id, provider, {
          isConnected: true,
          status: 'connected',
          connectedEmail: account.email,
          connectedAt: new Date(),
          externalUserId: 'uc-user-pending', // Will be populated after OAuth flow
          // Store OAuth credentials in providerData field
          providerData: {
            clientId: connectionData.clientId,
            // In production, we should encrypt the client secret
            clientSecret: connectionData.clientSecret,
            domain: connectionData.domain,
            credentialsStored: true,
            storedAt: new Date().toISOString(),
          },
        });

        // TODO: Trigger profile enrichment from integration data
        // This would be implemented when ProfileService is properly wired up

        return {
          success: true,
          message: 'Successfully connected to Ultimate Central with your OAuth credentials',
          redirectUrl: undefined, // In OAuth flow, this would be the auth URL
        };
      } else {
        throw new Error('OAuth credentials (clientId and clientSecret) are required for Ultimate Central integration');
      }
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  /**
   * Disconnect from a provider
   * TODO: This should be scoped to authenticated user, for now using seeded account
   */
  async disconnectProvider(provider: string): Promise<DisconnectResponse> {
    // Use the seeded account for now
    const account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      throw new Error('No account found');
    }

    // Get current connections to verify provider exists and is connected
    const connections = await this.accountsService.getIntegrationConnections(account.id);
    const connection = connections.find(conn => conn.provider === provider);

    if (!connection) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Provider ${provider} is not connected`);
    }

    // Simulate disconnection process
    await this.simulateAsync(500);

    // Update database connection
    await this.accountsService.updateIntegrationConnection(account.id, provider, {
      isConnected: false,
      status: 'disconnected',
      connectedEmail: undefined,
      connectedAt: undefined,
      lastSyncAt: undefined,
      errorMessage: undefined,
      encryptedAccessToken: undefined,
      encryptedRefreshToken: undefined,
      tokenExpiresAt: undefined,
    });

    return {
      success: true,
      message: `Successfully disconnected from ${provider}`,
    };
  }

  /**
   * Refresh connection for a provider
   * TODO: This should be scoped to authenticated user, for now using seeded account
   */
  async refreshConnection(provider: string): Promise<RefreshResponse> {
    // Use the seeded account for now
    const account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      throw new Error('No account found');
    }

    // Get current connections to verify provider exists and is connected
    const connections = await this.accountsService.getIntegrationConnections(account.id);
    const connection = connections.find(conn => conn.provider === provider);

    if (!connection) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Provider ${provider} is not connected`);
    }

    // Simulate refresh process
    await this.simulateAsync(800);

    // Update last sync time
    await this.accountsService.updateIntegrationConnection(account.id, provider, {
      lastSyncAt: new Date(),
    });

    return {
      success: true,
      message: `Successfully refreshed connection to ${provider}`,
    };
  }

  /**
   * Get connection status for a specific provider
   * TODO: This should be scoped to authenticated user, for now using seeded account
   */
  async getConnection(provider: string): Promise<SharedIntegrationConnection | undefined> {
    const account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      return undefined;
    }

    try {
      const connections = await this.accountsService.getIntegrationConnections(account.id);
      const connection = connections.find(conn => conn.provider === provider);

      if (!connection) {
        return undefined;
      }

      return {
        provider: connection.provider,
        isConnected: connection.isConnected,
        status: connection.status,
        connectedEmail: connection.connectedEmail,
        connectedAt: connection.connectedAt?.toISOString(),
        lastSyncAt: connection.lastSyncAt?.toISOString(),
        errorMessage: connection.errorMessage,
      };
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Check if a provider is connected
   * TODO: This should be scoped to a specific user account
   */
  async isProviderConnected(provider: string): Promise<boolean> {
    const connection = await this.getConnection(provider);
    return connection?.isConnected ?? false;
  }

  /**
   * Simulate async operation with delay
   */
  private async simulateAsync(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
