import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import {
  IntegrationProvider,
  IntegrationConnection as SharedIntegrationConnection,
  ConnectResponse,
  DisconnectResponse,
  RefreshResponse,
} from '@ultiverse/shared-types';
import { AccountsService } from './accounts.service';
import axios from 'axios';

@Injectable()
export class IntegrationsService {
  private ucConfigService: any; // Injected later to avoid circular dependency

  constructor(private readonly accountsService: AccountsService) {}

  setUCConfigService(ucConfigService: any) {
    this.ucConfigService = ucConfigService;
  }

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

    const connections = await this.accountsService.getIntegrationConnections(
      account.id,
    );

    return connections.map((conn) => ({
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
  async connectProvider(
    provider: string,
    connectionData?: { clientId: string; clientSecret: string; domain: string },
  ): Promise<ConnectResponse> {
    // Use the seeded account for now - in real implementation this would be from authentication
    const account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      throw new BadRequestException(
        'User account not found. Please ensure you are logged in.',
      );
    }

    // Validate provider
    const availableProviders = this.getAvailableProviders();
    const providerConfig = availableProviders.find(
      (p) => p.provider === provider,
    );

    if (!providerConfig) {
      throw new BadRequestException(`Unknown provider: ${provider}`);
    }

    if (!providerConfig.isAvailable) {
      throw new BadRequestException(
        `${providerConfig.name} integration is not yet available`,
      );
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
      if (
        connectionData &&
        connectionData.clientId &&
        connectionData.clientSecret
      ) {
        console.log('Received OAuth credentials for UC:', {
          clientId: connectionData.clientId,
          clientSecret: '***hidden***',
        });

        // In a real implementation, this would:
        // 1. Validate OAuth credentials with UC
        // 2. Generate OAuth state
        // 3. Return authorization URL
        // 4. Handle callback to complete the flow

        // Validate the OAuth credentials by attempting to get a token
        try {
          await this.validateUCCredentials(
            connectionData.clientId,
            connectionData.clientSecret,
            connectionData.domain, // This should be the API domain from UC page
          );
        } catch (error) {
          throw new BadRequestException(
            `Invalid OAuth credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }

        // Update database connection with OAuth credentials
        await this.accountsService.updateIntegrationConnection(
          account.id,
          provider,
          {
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
          },
        );

        // Refresh UC client with new credentials
        if (this.ucConfigService) {
          await this.ucConfigService.refreshUCClient();
        }

        // TODO: Trigger profile enrichment from integration data
        // This would be implemented when ProfileService is properly wired up

        return {
          success: true,
          message:
            'Successfully connected to Ultimate Central with your OAuth credentials',
          redirectUrl: undefined, // In OAuth flow, this would be the auth URL
        };
      } else {
        throw new BadRequestException(
          'OAuth credentials (clientId and clientSecret) are required for Ultimate Central integration',
        );
      }
    }

    throw new BadRequestException(`Unsupported provider: ${provider}`);
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
    const connections = await this.accountsService.getIntegrationConnections(
      account.id,
    );
    const connection = connections.find((conn) => conn.provider === provider);

    if (!connection) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Provider ${provider} is not connected`);
    }

    // Simulate disconnection process
    await this.simulateAsync(500);

    // Update database connection
    await this.accountsService.updateIntegrationConnection(
      account.id,
      provider,
      {
        isConnected: false,
        status: 'disconnected',
        connectedEmail: undefined,
        connectedAt: undefined,
        lastSyncAt: undefined,
        errorMessage: undefined,
        encryptedAccessToken: undefined,
        encryptedRefreshToken: undefined,
        tokenExpiresAt: undefined,
      },
    );

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
    const connections = await this.accountsService.getIntegrationConnections(
      account.id,
    );
    const connection = connections.find((conn) => conn.provider === provider);

    if (!connection) {
      throw new Error(`Unknown provider: ${provider}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Provider ${provider} is not connected`);
    }

    // Simulate refresh process
    await this.simulateAsync(800);

    // Update last sync time
    await this.accountsService.updateIntegrationConnection(
      account.id,
      provider,
      {
        lastSyncAt: new Date(),
      },
    );

    return {
      success: true,
      message: `Successfully refreshed connection to ${provider}`,
    };
  }

  /**
   * Get connection status for a specific provider
   * TODO: This should be scoped to authenticated user, for now using seeded account
   */
  async getConnection(
    provider: string,
  ): Promise<SharedIntegrationConnection | undefined> {
    const account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      return undefined;
    }

    try {
      const connections = await this.accountsService.getIntegrationConnections(
        account.id,
      );
      const connection = connections.find((conn) => conn.provider === provider);

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
   * Get stored UC OAuth credentials for the current user
   */
  async getUCCredentials(): Promise<{
    clientId: string;
    clientSecret: string;
    domain: string;
  } | null> {
    const account = await this.accountsService.findByEmail('greg@gregpike.ca');

    if (!account) {
      return null;
    }

    const connections = await this.accountsService.getIntegrationConnections(account.id);
    const ucConnection = connections.find(conn => conn.provider === 'uc' && conn.isConnected);

    if (!ucConnection || !ucConnection.providerData) {
      return null;
    }

    const providerData = ucConnection.providerData as any;

    if (!providerData.clientId || !providerData.clientSecret || !providerData.domain) {
      return null;
    }

    return {
      clientId: providerData.clientId,
      clientSecret: providerData.clientSecret,
      domain: providerData.domain,
    };
  }

  /**
   * Validate UC OAuth credentials by attempting to get an access token
   */
  private async validateUCCredentials(
    clientId: string,
    clientSecret: string,
    apiDomain: string,
  ): Promise<void> {
    // Normalize the API domain
    const normalizedDomain = apiDomain
      .replace(/^https?:\/\//i, '')
      .replace(/\/+$/g, '');
    const baseURL = `https://${normalizedDomain}`;

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    try {
      const response = await axios.post(`${baseURL}/api/oauth/server`, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
      });

      if (!response.data.access_token) {
        throw new Error('No access token received from UC');
      }

      // Success - credentials are valid
    } catch (error: any) {
      if (error.response) {
        // UC returned an error response
        const status = error.response.status;
        const message = error.response.data?.error || error.response.statusText;
        throw new Error(`UC API error (${status}): ${message}`);
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(
          `Cannot connect to UC at ${baseURL}. Please check the API domain.`,
        );
      } else {
        throw new Error(
          `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }

  /**
   * Simulate async operation with delay
   */
  private async simulateAsync(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
