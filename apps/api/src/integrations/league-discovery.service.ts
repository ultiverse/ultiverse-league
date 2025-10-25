import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  League,
  ExternalLeagueSource,
  Organization,
  IntegrationConnection,
} from '../database/entities';
import { UCAdapter } from './uc/uc.adapter';
import type { ProviderType } from '@ultiverse/shared-types';

export interface DiscoveredLeague {
  id: string;
  name: string;
  seasonStart?: Date;
  seasonEnd?: Date;
  sourceType: ProviderType;
  organizationId: string;
  externalSource?: {
    provider: ProviderType;
    externalId: string;
    lastSyncedAt?: Date;
    syncStatus?: string;
  };
}

/**
 * LeagueDiscoveryService
 *
 * Handles league discovery and persistence from external integrations.
 * Implements the de-duplication and sync logic for external leagues.
 */
@Injectable()
export class LeagueDiscoveryService {
  private readonly logger = new Logger(LeagueDiscoveryService.name);

  constructor(
    @InjectRepository(League)
    private readonly leagueRepo: Repository<League>,
    @InjectRepository(ExternalLeagueSource)
    private readonly externalSourceRepo: Repository<ExternalLeagueSource>,
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(IntegrationConnection)
    private readonly integrationRepo: Repository<IntegrationConnection>,
    private readonly ucAdapter: UCAdapter,
  ) {}

  /**
   * Discover and persist leagues from a connected integration for an account.
   * This is called after OAuth connection is established.
   */
  async discoverLeaguesForAccount(
    accountId: string,
    provider: ProviderType,
  ): Promise<DiscoveredLeague[]> {
    this.logger.log(
      `Discovering leagues for account ${accountId} from provider ${provider}`,
    );

    // Get the integration connection to ensure it's valid
    const connection: IntegrationConnection | null =
      await this.integrationRepo.findOne({
        where: { accountId, provider },
      });

    if (!connection || !connection.isConnected) {
      throw new Error(
        `No active connection found for provider ${provider} and account ${accountId}`,
      );
    }

    // Get or create a default organization for this account
    const organization = await this.getOrCreateDefaultOrganization(accountId);

    // Fetch leagues from the provider
    let externalLeagues: Array<{
      externalId: string;
      name: string;
      start?: string;
      end?: string;
      rawData: Record<string, unknown>;
    }> = [];

    if (provider === 'ultimate_central') {
      const ucLeagues = await this.ucAdapter.listRecent({ limit: 100 });
      externalLeagues = ucLeagues.map((league) => ({
        externalId: league.id,
        name: league.name,
        start: league.start,
        end: league.end,
        rawData: { ...league },
      }));
    }

    this.logger.log(`Found ${externalLeagues.length} leagues from ${provider}`);

    // Process each league: de-dupe and persist
    const discoveredLeagues: DiscoveredLeague[] = [];

    for (const extLeague of externalLeagues) {
      try {
        const discovered = await this.upsertExternalLeague(
          provider,
          extLeague.externalId,
          extLeague.name,
          extLeague.start ? new Date(extLeague.start) : undefined,
          extLeague.end ? new Date(extLeague.end) : undefined,
          organization.id,
          extLeague.rawData,
        );
        discoveredLeagues.push(discovered);
      } catch (error) {
        this.logger.error(
          `Failed to process league ${extLeague.name} (${extLeague.externalId}): ${error instanceof Error ? error.message : error}`,
        );
        // Continue processing other leagues
      }
    }

    this.logger.log(
      `Successfully discovered ${discoveredLeagues.length} leagues`,
    );

    return discoveredLeagues;
  }

  /**
   * Upsert a single external league (de-dupe by provider + externalId).
   * Creates canonical League if needed, otherwise updates the mirror.
   */
  private async upsertExternalLeague(
    provider: ProviderType,
    externalId: string,
    name: string,
    seasonStart: Date | undefined,
    seasonEnd: Date | undefined,
    organizationId: string,
    rawData: Record<string, unknown>,
    etag?: string,
    lastModifiedAt?: Date,
  ): Promise<DiscoveredLeague> {
    // Check if we already have an ExternalLeagueSource for this (provider, externalId)
    let externalSource = await this.externalSourceRepo.findOne({
      where: { provider, externalId },
      relations: ['league'],
    });

    let league: League;

    if (externalSource) {
      // Already exists - update the mirror
      league = externalSource.league;

      externalSource.rawData = rawData;
      externalSource.etag = etag;
      externalSource.lastModifiedAt = lastModifiedAt || new Date();
      externalSource.lastSyncedAt = new Date();
      externalSource.syncStatus = 'active';

      await this.externalSourceRepo.save(externalSource);

      // Update canonical league fields if isEditable=false (respect user edits)
      if (!league.isEditable) {
        league.name = name;
        league.seasonStart = seasonStart;
        league.seasonEnd = seasonEnd;
        await this.leagueRepo.save(league);
      }

      this.logger.log(
        `Updated existing league: ${name} (${externalId}) -> canonical ID: ${league.id}`,
      );
    } else {
      // New league - create canonical League + ExternalLeagueSource
      league = this.leagueRepo.create({
        organizationId,
        name,
        seasonStart,
        seasonEnd,
        sourceType: provider,
        isEditable: false, // External leagues are not editable
        visibility: 'public',
      });

      league = await this.leagueRepo.save(league);

      externalSource = this.externalSourceRepo.create({
        leagueId: league.id,
        provider,
        externalId,
        rawData,
        etag,
        lastModifiedAt: lastModifiedAt || new Date(),
        lastSyncedAt: new Date(),
        syncStatus: 'active',
      });

      await this.externalSourceRepo.save(externalSource);

      this.logger.log(
        `Created new league: ${name} (${externalId}) -> canonical ID: ${league.id}`,
      );
    }

    return {
      id: league.id,
      name: league.name,
      seasonStart: league.seasonStart,
      seasonEnd: league.seasonEnd,
      sourceType: league.sourceType,
      organizationId: league.organizationId,
      externalSource: {
        provider: externalSource.provider,
        externalId: externalSource.externalId,
        lastSyncedAt: externalSource.lastSyncedAt,
        syncStatus: externalSource.syncStatus,
      },
    };
  }

  /**
   * Get or create a default organization for an account.
   * For MVP, we create one organization per account.
   */
  private async getOrCreateDefaultOrganization(
    accountId: string,
  ): Promise<Organization> {
    const orgSlug = `org-${accountId.substring(0, 8)}`;
    const orgName = `Organization for ${accountId}`;

    // Try to find existing organization for this account by slug (unique key)
    let org = await this.orgRepo.findOne({
      where: { slug: orgSlug },
    });

    if (!org) {
      // Also check by name in case slug was not set
      org = await this.orgRepo.findOne({
        where: { name: orgName },
      });
    }

    if (!org) {
      try {
        org = this.orgRepo.create({
          name: orgName,
          slug: orgSlug,
        });
        org = await this.orgRepo.save(org);
        this.logger.log(`Created default organization: ${org.id}`);
      } catch (error) {
        // Handle race condition - organization might have been created by another request
        if (error instanceof Error && error.message.includes('duplicate key')) {
          // Try to find it again
          org = await this.orgRepo.findOne({
            where: { slug: orgSlug },
          });
          if (!org) {
            throw new Error('Failed to create or find organization after conflict');
          }
          this.logger.log(`Found existing organization after conflict: ${org.id}`);
        } else {
          throw error;
        }
      }
    }

    return org;
  }

  /**
   * Check if a league is stale (needs refresh).
   * Returns true if lastSyncedAt is > 7 days old or null.
   */
  isLeagueStale(leagueId: string): Promise<boolean> {
    return this.externalSourceRepo
      .findOne({
        where: { leagueId },
      })
      .then((source) => {
        if (!source) return false; // Not an external league
        if (!source.lastSyncedAt) return true;

        const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
        const age = Date.now() - source.lastSyncedAt.getTime();
        return age > staleThreshold;
      });
  }
}
