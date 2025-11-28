import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Team,
  ExternalTeamSource,
  League,
  ExternalLeagueSource,
} from '../database/entities';
import { UCAdapter } from './uc/uc.adapter';
import type { ProviderType } from '@ultiverse/shared-types';

export interface DiscoveredTeam {
  id: string;
  name: string;
  leagueId: string;
  sourceType: ProviderType;
  externalSource?: {
    provider: ProviderType;
    externalId: string;
    lastSyncedAt?: Date;
    syncStatus?: string;
  };
}

/**
 * TeamDiscoveryService
 *
 * Handles team discovery and persistence from external integrations.
 * Discovers teams for a specific league and stores them with de-duplication.
 */
@Injectable()
export class TeamDiscoveryService {
  private readonly logger = new Logger(TeamDiscoveryService.name);

  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(ExternalTeamSource)
    private readonly externalTeamSourceRepo: Repository<ExternalTeamSource>,
    @InjectRepository(League)
    private readonly leagueRepo: Repository<League>,
    @InjectRepository(ExternalLeagueSource)
    private readonly externalLeagueSourceRepo: Repository<ExternalLeagueSource>,
    private readonly ucAdapter: UCAdapter,
  ) {}

  /**
   * Discover and persist teams from an external league.
   * Called when a league manager opens a league and teams need to be synced.
   */
  async discoverTeamsForLeague(
    leagueId: string,
    provider: ProviderType,
  ): Promise<DiscoveredTeam[]> {
    this.logger.log(
      `Discovering teams for league ${leagueId} from provider ${provider}`,
    );

    // Find the canonical league and its external source
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['externalSources'],
    });

    if (!league) {
      throw new Error(`League ${leagueId} not found`);
    }

    // Find the external source for this league
    const externalSource = league.externalSources?.find(
      (s) => s.provider === provider,
    );

    if (!externalSource) {
      throw new Error(
        `No external source found for league ${leagueId} with provider ${provider}`,
      );
    }

    const externalLeagueId = externalSource.externalId;

    // Fetch teams from the provider
    let externalTeams: Array<{
      externalId: string;
      name: string;
      division?: string | null;
      colour?: string;
      altColour?: string;
      rawData: Record<string, unknown>;
    }> = [];

    if (provider === 'uc') {
      const ucTeams = await this.ucAdapter.listTeams(externalLeagueId);
      externalTeams = ucTeams.map((team) => ({
        externalId: team.id,
        name: team.name,
        division: team.division,
        colour: team.colour || '#000000',
        altColour: team.altColour || '#ffffff',
        rawData: { ...team },
      }));
    } else {
      throw new Error(`Provider ${provider} not supported for team discovery`);
    }

    this.logger.log(
      `Found ${externalTeams.length} teams for league ${leagueId}`,
    );

    // Process each team: de-dupe and persist
    const discoveredTeams: DiscoveredTeam[] = [];

    for (const extTeam of externalTeams) {
      const discovered = await this.upsertExternalTeam(
        provider,
        extTeam.externalId,
        extTeam.name,
        leagueId,
        league.organizationId,
        league.seasonStart || new Date(),
        league.seasonEnd,
        extTeam.colour || '#000000',
        extTeam.altColour || '#ffffff',
        extTeam.rawData,
      );
      discoveredTeams.push(discovered);
    }

    return discoveredTeams;
  }

  /**
   * Upsert a single external team (de-dupe by source + externalId).
   */
  private async upsertExternalTeam(
    provider: ProviderType,
    externalId: string,
    name: string,
    leagueId: string,
    organizationId: string,
    seasonStart: Date,
    seasonEnd: Date | undefined,
    colour: string,
    altColour: string,
    rawData: Record<string, unknown>,
  ): Promise<DiscoveredTeam> {
    // Check if we already have an ExternalTeamSource for this provider+externalId
    let externalSource = await this.externalTeamSourceRepo.findOne({
      where: { source: provider, externalId },
      relations: ['team'],
    });

    if (externalSource) {
      // Update existing mirror
      externalSource.rawData = rawData;
      externalSource.lastSyncedAt = new Date();
      externalSource.syncStatus = 'active';
      await this.externalTeamSourceRepo.save(externalSource);

      const team = externalSource.team;

      // Update canonical team if isEditable=false (external teams shouldn't be edited)
      if (!team.isEditable) {
        team.name = name;
        team.colour = colour;
        team.altColour = altColour;
        team.seasonStart = seasonStart;
        team.seasonEnd = seasonEnd;
        await this.teamRepo.save(team);
      }

      return {
        id: team.id,
        name: team.name,
        leagueId: team.leagueId!,
        sourceType: team.sourceType,
        externalSource: {
          provider: externalSource.source,
          externalId: externalSource.externalId,
          lastSyncedAt: externalSource.lastSyncedAt,
          syncStatus: externalSource.syncStatus,
        },
      };
    } else {
      // Create new canonical Team + ExternalTeamSource
      const team = this.teamRepo.create({
        organizationId,
        leagueId,
        name,
        sourceType: provider,
        isEditable: false,
        seasonStart,
        seasonEnd,
        colour,
        altColour,
      });

      const savedTeam = await this.teamRepo.save(team);

      // Create external source mirror
      externalSource = this.externalTeamSourceRepo.create({
        teamId: savedTeam.id,
        source: provider,
        externalId,
        rawData,
        lastSyncedAt: new Date(),
        syncStatus: 'active',
      });

      await this.externalTeamSourceRepo.save(externalSource);

      return {
        id: savedTeam.id,
        name: savedTeam.name,
        leagueId: savedTeam.leagueId!,
        sourceType: savedTeam.sourceType,
        externalSource: {
          provider: externalSource.source,
          externalId: externalSource.externalId,
          lastSyncedAt: externalSource.lastSyncedAt,
          syncStatus: externalSource.syncStatus,
        },
      };
    }
  }

  /**
   * Check if teams for a league are stale (>7 days since last sync).
   */
  async areTeamsStale(leagueId: string): Promise<boolean> {
    const teams = await this.teamRepo.find({
      where: { leagueId },
      relations: ['externalSources'],
    });

    if (teams.length === 0) {
      return true; // No teams = stale
    }

    const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Check if any team has an external source that's stale
    for (const team of teams) {
      const externalSource = team.externalSources?.[0];
      if (externalSource && externalSource.lastSyncedAt) {
        const age = Date.now() - externalSource.lastSyncedAt.getTime();
        if (age > staleThreshold) {
          return true;
        }
      }
    }

    return false;
  }
}
