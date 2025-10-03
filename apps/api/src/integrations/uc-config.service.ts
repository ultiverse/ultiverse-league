import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { UCClient } from './uc/uc.client';
import { IntegrationsService } from './integrations.service';

/**
 * Service that configures the UC client with stored OAuth credentials
 */
@Injectable()
export class UCConfigService implements OnModuleInit {
  private readonly logger = new Logger(UCConfigService.name);

  constructor(
    private readonly ucClient: UCClient,
    private readonly integrationsService: IntegrationsService,
  ) {}

  async onModuleInit() {
    // Set up the circular reference
    this.integrationsService.setUCConfigService(this);
    await this.configureUCClient();
  }

  /**
   * Configure the UC client with stored credentials if available
   */
  async configureUCClient(): Promise<void> {
    try {
      const credentials = await this.integrationsService.getUCCredentials();

      if (credentials) {
        this.ucClient.setCredentials(credentials);
        this.logger.log('UC client configured with stored credentials');
      } else {
        this.logger.warn('No UC credentials found in database');
      }
    } catch (error) {
      this.logger.error('Failed to configure UC client with stored credentials', error);
    }
  }

  /**
   * Reconfigure the UC client with fresh credentials from the database
   * Call this after OAuth credentials are updated
   */
  async refreshUCClient(): Promise<void> {
    await this.configureUCClient();
  }
}