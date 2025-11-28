import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Player,
  ExternalPlayerSource,
  Membership,
} from '../database/entities';
import { PLAYERS_PROVIDER } from './ports/players.port';
import type { IPlayersProvider } from './ports/players.port';
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
    @Inject(PLAYERS_PROVIDER)
    private readonly playersProvider: IPlayersProvider,
  ) {}

  /**
   * Discover and persist players for all teams in a league.
   * Called when a league is opened/refreshed and rosters need to be synced.
   * Uses bulk fetching from the provider for efficiency.
   */
  async discoverPlayersForLeague(
    leagueId: string,
    provider: ProviderType,
  ): Promise<DiscoveredPlayer[]> {
    this.logger.log(
      `Discovering players for league ${leagueId} from provider ${provider}`,
    );

    // Use the players provider to bulk fetch all players for the league
    const players = await this.playersProvider.listPlayersForLeague(leagueId);

    this.logger.log(
      `Found ${players.length} players from provider, upserting...`,
    );

    const discoveredPlayers: DiscoveredPlayer[] = [];
    for (const player of players) {
      if (!player.internalTeamId) {
        this.logger.warn(
          `No internal team found for player ${player.externalPlayerId}, skipping`,
        );
        continue;
      }

      try {
        const discovered = await this.upsertExternalPlayer(
          provider,
          player.externalPlayerId,
          player.fullName,
          player.email,
          player.internalTeamId,
          leagueId,
          player.rawData,
        );
        discoveredPlayers.push(discovered);
      } catch (error) {
        this.logger.error(
          `Failed to upsert player ${player.externalPlayerId}: ${error instanceof Error ? error.message : error}`,
        );
        // Continue with other players
      }
    }

    this.logger.log(
      `Discovered ${discoveredPlayers.length} total players for league ${leagueId}`,
    );

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
