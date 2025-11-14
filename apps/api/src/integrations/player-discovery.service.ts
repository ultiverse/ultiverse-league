import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Player,
  ExternalPlayerSource,
  Membership,
  Team,
  League,
  ExternalLeagueSource,
} from '../database/entities';
import { UCRegistrationsService } from './uc/uc.registrations/uc.registrations.service';
import type { ProviderType } from '@ultiverse/shared-types';

export interface DiscoveredPlayer {
  id: string;
  fullName?: string;
  primaryEmail?: string;
  externalSource?: {
    provider: ProviderType;
    externalId: string;
    lastSyncedAt?: Date;
  };
}

/**
 * PlayerDiscoveryService
 *
 * Handles player/roster discovery and persistence from external integrations.
 * Discovers players for a specific team or league and creates Player + Membership records.
 */
@Injectable()
export class PlayerDiscoveryService {
  private readonly logger = new Logger(PlayerDiscoveryService.name);

  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
    @InjectRepository(ExternalPlayerSource)
    private readonly externalPlayerSourceRepo: Repository<ExternalPlayerSource>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    private readonly ucRegistrationsService: UCRegistrationsService,
  ) {}

  /**
   * Discover and persist players for all teams in a league.
   * Called when a league is opened/refreshed and rosters need to be synced.
   */
  async discoverPlayersForLeague(
    leagueId: string,
    provider: ProviderType,
  ): Promise<DiscoveredPlayer[]> {
    this.logger.log(
      `Discovering players for league ${leagueId} from provider ${provider}`,
    );

    // Get all teams in the league
    const teams = await this.teamRepo.find({
      where: { leagueId },
      relations: ['externalSources'],
    });

    if (teams.length === 0) {
      this.logger.warn(`No teams found for league ${leagueId}`);
      return [];
    }

    this.logger.log(
      `Found ${teams.length} teams in league, fetching rosters...`,
    );

    // Discover players for each team
    const allPlayers: DiscoveredPlayer[] = [];
    for (const team of teams) {
      try {
        const players = await this.discoverPlayersForTeam(
          team.id,
          leagueId,
          provider,
        );
        allPlayers.push(...players);
      } catch (error) {
        this.logger.error(
          `Failed to discover players for team ${team.name} (${team.id}): ${error instanceof Error ? error.message : error}`,
        );
        // Continue with other teams
      }
    }

    this.logger.log(
      `Discovered ${allPlayers.length} total players for league ${leagueId}`,
    );

    return allPlayers;
  }

  /**
   * Discover and persist players for a specific team.
   * Fetches roster from external source and creates Player + Membership records.
   */
  async discoverPlayersForTeam(
    teamId: string,
    leagueId: string,
    provider: ProviderType,
  ): Promise<DiscoveredPlayer[]> {
    this.logger.log(
      `Discovering players for team ${teamId} from provider ${provider}`,
    );

    // Find the team and its external source
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['externalSources'],
    });

    if (!team) {
      throw new Error(`Team ${teamId} not found`);
    }

    // Find the external source for this team
    const externalSource = team.externalSources?.find(
      (s) => s.source === provider,
    );

    if (!externalSource) {
      throw new Error(
        `No external source found for team ${teamId} with provider ${provider}`,
      );
    }

    // Fetch players from the provider
    let externalPlayers: Array<{
      externalId: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      fullName?: string;
      rawData: Record<string, unknown>;
    }> = [];

    if (provider === 'ultimate_central') {
      // UC uses registrations to get team rosters
      // We need the event_id which is stored in the league's external source
      const league = (await this.teamRepo.manager.findOne('leagues', {
        where: { id: leagueId },
        relations: ['externalSources'],
      })) as (League & { externalSources: ExternalLeagueSource[] }) | null;

      if (!league) {
        throw new Error(`League ${leagueId} not found`);
      }

      const leagueSource = league.externalSources?.find(
        (s) => s.provider === provider,
      );

      if (!leagueSource) {
        throw new Error(
          `No external source found for league ${leagueId} with provider ${provider}`,
        );
      }

      const eventId = Number(leagueSource.externalId);

      // Fetch registrations for the event
      const response = await this.ucRegistrationsService.list(eventId, true);

      // Filter registrations by team_id if available in rawData
      // Note: UC registrations might not have team assignments in the API
      // This is a simplified version - you may need to adjust based on actual UC API
      externalPlayers = response.result
        .filter((reg) => reg.Person) // Only include registrations with person data
        .map((reg) => ({
          externalId: reg.person_id.toString(),
          email: reg.Person?.email_address || reg.Person?.email_canonical,
          firstName: reg.Person?.first_name,
          lastName: reg.Person?.last_name,
          fullName: reg.Person?.full_name,
          rawData: { ...reg.Person },
        }));
    } else {
      throw new Error(
        `Provider ${provider} not supported for player discovery`,
      );
    }

    this.logger.log(
      `Found ${externalPlayers.length} players for team ${team.name}`,
    );

    // Process each player: de-dupe and persist
    const discoveredPlayers: DiscoveredPlayer[] = [];

    for (const extPlayer of externalPlayers) {
      const discovered = await this.upsertExternalPlayer(
        provider,
        extPlayer.externalId,
        extPlayer.fullName ||
          `${extPlayer.firstName || ''} ${extPlayer.lastName || ''}`.trim(),
        extPlayer.email,
        teamId,
        leagueId,
        extPlayer.rawData,
      );
      discoveredPlayers.push(discovered);
    }

    return discoveredPlayers;
  }

  /**
   * Upsert a single external player (de-dupe by provider + externalId).
   */
  private async upsertExternalPlayer(
    provider: ProviderType,
    externalId: string,
    fullName?: string,
    primaryEmail?: string,
    teamId?: string,
    leagueId?: string,
    rawData?: Record<string, unknown>,
  ): Promise<DiscoveredPlayer> {
    // Check if we already have an ExternalPlayerSource for this provider+externalId
    let externalSource = await this.externalPlayerSourceRepo.findOne({
      where: { provider, externalId },
      relations: ['player'],
    });

    let player: Player;

    if (externalSource) {
      // Update existing mirror
      externalSource.rawData = rawData || {};
      externalSource.lastSyncedAt = new Date();
      await this.externalPlayerSourceRepo.save(externalSource);

      player = externalSource.player;

      // Update canonical player with latest data
      if (fullName) player.fullName = fullName;
      if (primaryEmail) player.primaryEmail = primaryEmail;
      await this.playerRepo.save(player);

      this.logger.log(
        `Updated existing player: ${player.fullName} (${player.id})`,
      );
    } else {
      // Create new canonical Player + ExternalPlayerSource
      player = this.playerRepo.create({
        fullName,
        primaryEmail,
      });

      player = await this.playerRepo.save(player);

      // Create external source mirror
      externalSource = this.externalPlayerSourceRepo.create({
        playerId: player.id,
        provider,
        externalId,
        rawData: rawData || {},
        lastSyncedAt: new Date(),
      });

      await this.externalPlayerSourceRepo.save(externalSource);

      this.logger.log(`Created new player: ${player.fullName} (${player.id})`);
    }

    // Create/update membership if team and league are provided
    if (teamId && leagueId) {
      await this.ensureMembership(player.id, teamId, leagueId, provider);
    }

    return {
      id: player.id,
      fullName: player.fullName,
      primaryEmail: player.primaryEmail,
      externalSource: {
        provider: externalSource.provider,
        externalId: externalSource.externalId,
        lastSyncedAt: externalSource.lastSyncedAt,
      },
    };
  }

  /**
   * Ensure player has a membership to the team.
   * Idempotent - won't create duplicates.
   */
  private async ensureMembership(
    playerId: string,
    teamId: string,
    leagueId: string,
    provider: string,
  ): Promise<void> {
    const existingMembership = await this.membershipRepo.findOne({
      where: { playerId, teamId, leagueId, isActive: true },
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
        playerId,
        teamId,
        leagueId,
        role: 'player',
        joinedVia,
        isActive: true,
      });

      await this.membershipRepo.save(membership);
      this.logger.log(
        `Created membership for player ${playerId} to team ${teamId}`,
      );
    }
  }

  /**
   * Check if players for a team are stale (>7 days since last sync).
   */
  async arePlayersStale(teamId: string): Promise<boolean> {
    const memberships = await this.membershipRepo.find({
      where: { teamId, isActive: true },
      relations: ['player', 'player.externalSources'],
    });

    if (memberships.length === 0) {
      return true; // No players = stale
    }

    const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Check if any player has an external source that's stale
    for (const membership of memberships) {
      const player = membership.player;
      if (!player) continue;

      const externalSources = player.externalSources;
      if (!externalSources || externalSources.length === 0) continue;

      const externalSource = externalSources[0];
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
