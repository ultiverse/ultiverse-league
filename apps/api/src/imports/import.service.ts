import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { ProviderType } from '@ultiverse/shared-types';
import {
  League,
  ExternalLeagueSource,
  Team,
  ExternalTeamSource,
  Membership,
  Organization,
} from '../database/entities';
import {
  LeagueAdapter,
  LeagueKey,
  ExternalLeague,
  ExternalTeam,
} from './ports/league-adapter.interface';

export interface ImportOptions {
  onDemand?: boolean;
  forceRefresh?: boolean;
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private adapters = new Map<string, LeagueAdapter>();

  constructor(
    @InjectRepository(League)
    private leagueRepo: Repository<League>,
    @InjectRepository(ExternalLeagueSource)
    private leagueSourceRepo: Repository<ExternalLeagueSource>,
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(ExternalTeamSource)
    private teamSourceRepo: Repository<ExternalTeamSource>,
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,
    @InjectRepository(Organization)
    private organizationRepo: Repository<Organization>,
  ) {}

  /**
   * Register an adapter for a provider
   */
  registerAdapter(provider: string, adapter: LeagueAdapter): void {
    this.adapters.set(provider, adapter);
    this.logger.log(`Registered adapter for provider: ${provider}`);
  }

  /**
   * Get adapter for a provider
   */
  private getAdapter(provider: string): LeagueAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${provider}`);
    }
    return adapter;
  }

  /**
   * Import a league with all its teams from an external provider
   * Returns the canonical league ID
   */
  async importLeague(
    provider: string,
    leagueKey: LeagueKey,
    userId: string,
    organizationId: string,
    opts?: ImportOptions,
  ): Promise<string> {
    this.logger.log(
      `Importing league ${leagueKey.externalId} from ${provider}`,
    );

    // 1) Fetch league data from provider adapter
    const adapter = this.getAdapter(provider);
    const extLeague = await adapter.fetchLeague(leagueKey);

    // 2) Upsert canonical league + external source
    const league = await this.upsertLeagueFromExternal(
      organizationId,
      provider,
      extLeague,
    );

    // 3) Fetch and import teams
    const extTeams = await adapter.fetchTeams(leagueKey);
    this.logger.log(`Found ${extTeams.length} teams in league ${league.name}`);

    for (const extTeam of extTeams) {
      await this.upsertTeamFromExternal(
        league.id,
        organizationId,
        provider,
        extTeam,
        userId,
      );
    }

    this.logger.log(
      `Successfully imported league ${league.name} (${league.id})`,
    );
    return league.id;
  }

  /**
   * Upsert a league from external data
   * Returns the canonical League entity
   */
  private async upsertLeagueFromExternal(
    organizationId: string,
    provider: string,
    extLeague: ExternalLeague,
  ): Promise<League> {
    const providerType = provider as ProviderType;

    // Check if league already exists via external source
    const existingSource = await this.leagueSourceRepo.findOne({
      where: {
        provider: providerType,
        externalId: extLeague.externalId,
      },
      relations: ['league'],
    });

    if (existingSource) {
      this.logger.log(
        `League ${extLeague.name} already exists (${existingSource.leagueId})`,
      );

      // Update sync metadata
      existingSource.rawData = extLeague.rawData;
      existingSource.lastSyncedAt = new Date();
      existingSource.syncStatus = 'active';
      await this.leagueSourceRepo.save(existingSource);

      // Optionally update canonical if is_editable=false
      if (!existingSource.league.isEditable) {
        existingSource.league.name = extLeague.name;
        existingSource.league.seasonStart = extLeague.seasonStart;
        existingSource.league.seasonEnd = extLeague.seasonEnd;
        await this.leagueRepo.save(existingSource.league);
      }

      return existingSource.league;
    }

    // Create new league
    const league = this.leagueRepo.create({
      organizationId,
      name: extLeague.name,
      seasonStart: extLeague.seasonStart,
      seasonEnd: extLeague.seasonEnd,
      sourceType: providerType,
      isEditable: false, // External leagues are read-only by default
    });

    const savedLeague = await this.leagueRepo.save(league);
    this.logger.log(
      `Created new league: ${savedLeague.name} (${savedLeague.id})`,
    );

    // Create external source
    const source = this.leagueSourceRepo.create({
      leagueId: savedLeague.id,
      provider: providerType,
      externalId: extLeague.externalId,
      rawData: extLeague.rawData,
      lastSyncedAt: new Date(),
      syncStatus: 'active',
    });

    await this.leagueSourceRepo.save(source);

    return savedLeague;
  }

  /**
   * Upsert a team from external data
   * Returns the canonical Team entity
   */
  private async upsertTeamFromExternal(
    leagueId: string,
    organizationId: string,
    provider: string,
    extTeam: ExternalTeam,
    userId: string,
  ): Promise<Team> {
    const providerType = provider as ProviderType;

    // Check if team already exists via external source
    const existingSource = await this.teamSourceRepo.findOne({
      where: {
        source: providerType,
        externalId: extTeam.externalId,
      },
      relations: ['team'],
    });

    let team: Team;

    if (existingSource) {
      team = existingSource.team;
      this.logger.log(`Team ${extTeam.name} already exists (${team.id})`);

      // Update sync metadata
      existingSource.rawData = extTeam.rawData;
      existingSource.lastSyncedAt = new Date();
      existingSource.syncStatus = 'active';
      await this.teamSourceRepo.save(existingSource);

      // Update canonical if is_editable=false
      if (!team.isEditable) {
        team.name = extTeam.name;
        team.location = extTeam.location;
        team.colour = extTeam.colour || team.colour;
        team.altColour = extTeam.altColour || team.altColour;
        team.leagueId = leagueId; // Update league link
        await this.teamRepo.save(team);
      }
    } else {
      // Create new team
      // Get league to extract season dates
      const league = await this.leagueRepo.findOne({ where: { id: leagueId } });

      team = this.teamRepo.create({
        organizationId,
        leagueId,
        name: extTeam.name,
        location: extTeam.location,
        seasonStart: league?.seasonStart || new Date(),
        seasonEnd: league?.seasonEnd,
        sourceType: providerType,
        isEditable: false,
        colour: extTeam.colour || '#000000',
        altColour: extTeam.altColour || '#ffffff',
      });

      team = await this.teamRepo.save(team);
      this.logger.log(`Created new team: ${team.name} (${team.id})`);

      // Create external source
      const source = this.teamSourceRepo.create({
        teamId: team.id,
        source: providerType,
        externalId: extTeam.externalId,
        rawData: extTeam.rawData,
        lastSyncedAt: new Date(),
        syncStatus: 'active',
      });

      await this.teamSourceRepo.save(source);
    }

    // Link user to team via membership
    await this.ensureMembership(userId, team.id, leagueId, provider);

    return team;
  }

  /**
   * Ensure user has a membership to the team
   * Idempotent - won't create duplicates
   */
  private async ensureMembership(
    userId: string,
    teamId: string,
    leagueId: string,
    provider: string,
  ): Promise<void> {
    const existingMembership = await this.membershipRepo.findOne({
      where: { userId, teamId, leagueId, isActive: true },
    });

    if (!existingMembership) {
      const joinedViaMap: Record<
        string,
        'manual' | 'uc_import' | 'zuluru_import'
      > = {
        ultimate_central: 'uc_import',
        uc: 'uc_import',
        zuluru: 'zuluru_import',
      };
      const joinedVia = joinedViaMap[provider] || 'manual';

      const membership = this.membershipRepo.create({
        userId,
        teamId,
        leagueId,
        role: 'player',
        joinedVia,
        isActive: true,
      });

      await this.membershipRepo.save(membership);
      this.logger.log(
        `Created membership for user ${userId} to team ${teamId}`,
      );
    }
  }

  /**
   * Check if a league needs refresh based on staleness
   */
  isLeagueStale(lastSyncedAt?: Date, stalenessDays = 7): boolean {
    if (!lastSyncedAt) return false;

    const staleCutoff = new Date();
    staleCutoff.setDate(staleCutoff.getDate() - stalenessDays);

    return lastSyncedAt < staleCutoff;
  }

  /**
   * Refresh a league from its external source
   */
  async refreshLeague(leagueId: string): Promise<void> {
    const source = await this.leagueSourceRepo.findOne({
      where: { leagueId },
      relations: ['league'],
    });

    if (!source) {
      throw new Error(`League ${leagueId} has no external source`);
    }

    const league = source.league;
    const leagueKey: LeagueKey = {
      provider: source.provider,
      externalId: source.externalId,
    };

    // Re-import the league (will update existing data)
    await this.importLeague(
      source.provider,
      leagueKey,
      '', // userId not needed for refresh
      league.organizationId,
      { forceRefresh: true },
    );

    this.logger.log(`Refreshed league ${league.name} (${leagueId})`);
  }
}
