import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';

/**
 * IntegrationsController
 *
 * Manages integration connections, authentication, and configuration.
 * Provides endpoints for connecting/disconnecting external providers,
 * checking connection status, and managing integration settings.
 */
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  /**
   * GET /integrations/providers
   * Returns list of available integration providers with their capabilities.
   */
  @Get('providers')
  getAvailableProviders() {
    return this.integrationsService.getAvailableProviders();
  }

  /**
   * GET /integrations/connections
   * Returns current connection status for all providers.
   */
  @Get('connections')
  async getConnections() {
    return this.integrationsService.getConnections();
  }

  /**
   * POST /integrations/connect/:provider
   * Initiates connection flow for a specific provider.
   * For OAuth providers, accepts client credentials and returns authorization URL.
   */
  @Post('connect/:provider')
  async connectProvider(@Param('provider') provider: string, @Body() connectionData?: any) {
    return this.integrationsService.connectProvider(provider, connectionData);
  }

  /**
   * DELETE /integrations/disconnect/:provider
   * Disconnects and removes credentials for a provider.
   */
  @Delete('disconnect/:provider')
  async disconnectProvider(@Param('provider') provider: string) {
    return this.integrationsService.disconnectProvider(provider);
  }

  /**
   * POST /integrations/refresh/:provider
   * Refreshes connection/tokens for a provider.
   */
  @Post('refresh/:provider')
  async refreshConnection(@Param('provider') provider: string) {
    return this.integrationsService.refreshConnection(provider);
  }
}
