import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Game,
  ExternalGameSource,
  League,
  ExternalLeagueSource,
  Team,
  ExternalTeamSource,
} from '../database/entities';
import { UCGamesService } from './uc/uc.games/uc.games.service';
import type { ProviderType } from '@ultiverse/shared-types';

export interface DiscoveredGame {
  id: string;
  leagueId: string;
  homeTeamId?: string;
  awayTeamId?: string;
  startTime: Date;
  externalSource?: {
    provider: ProviderType;
    externalId: string;
    lastSyncedAt?: Date;
  };
}

/**
 * GameDiscoveryService
 *
 * Handles game/schedule discovery and persistence from external integrations.
 * Discovers games for a specific league and creates Game + ExternalGameSource records.
 */
@Injectable()
export class GameDiscoveryService {
  private readonly logger = new Logger(GameDiscoveryService.name);

  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    @InjectRepository(ExternalGameSource)
    private readonly externalGameSourceRepo: Repository<ExternalGameSource>,
    @InjectRepository(League)
    private readonly leagueRepo: Repository<League>,
    @InjectRepository(ExternalLeagueSource)
    private readonly externalLeagueSourceRepo: Repository<ExternalLeagueSource>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(ExternalTeamSource)
    private readonly externalTeamSourceRepo: Repository<ExternalTeamSource>,
    private readonly ucGamesService: UCGamesService,
  ) {}

  /**
   * Discover and persist games for a league.
   * Called when a league is opened/refreshed and schedule needs to be synced.
   */
  async discoverGamesForLeague(
    leagueId: string,
    provider: ProviderType,
  ): Promise<DiscoveredGame[]> {
    this.logger.log(
      `Discovering games for league ${leagueId} from provider ${provider}`,
    );

    // Find the league and its external source
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

    // Fetch games from the provider
    let externalGames: Array<{
      externalId: string;
      homeTeamExternalId?: string;
      awayTeamExternalId?: string;
      date?: string;
      time?: string;
      status?: string;
      fieldName?: string;
      rawData: Record<string, unknown>;
    }> = [];

    if (provider === 'uc') {
      const eventId = Number(externalLeagueId);

      // Fetch games for the event
      const response = await this.ucGamesService.list({
        event_id: eventId,
        per_page: 1000, // Get all games
      });

      externalGames = response.result.map((game) => ({
        externalId: game.id.toString(),
        homeTeamExternalId: game.home_team_id?.toString(),
        awayTeamExternalId: game.away_team_id?.toString(),
        date: game.date || undefined,
        time: game.time || undefined,
        status: game.status,
        fieldName: game.field || undefined,
        rawData: { ...game },
      }));
    } else {
      throw new Error(`Provider ${provider} not supported for game discovery`);
    }

    this.logger.log(
      `Found ${externalGames.length} games for league ${league.name}`,
    );

    // Process each game: de-dupe and persist
    const discoveredGames: DiscoveredGame[] = [];

    for (const extGame of externalGames) {
      try {
        // Map external team IDs to canonical team IDs
        const homeTeamId = extGame.homeTeamExternalId
          ? await this.findCanonicalTeamId(provider, extGame.homeTeamExternalId)
          : undefined;

        const awayTeamId = extGame.awayTeamExternalId
          ? await this.findCanonicalTeamId(provider, extGame.awayTeamExternalId)
          : undefined;

        // Combine date and time to create startTime
        const startTime = this.parseGameDateTime(extGame.date, extGame.time);

        if (!startTime) {
          this.logger.warn(
            `Game ${extGame.externalId} has no date/time, skipping`,
          );
          continue;
        }

        const discovered = await this.upsertExternalGame(
          provider,
          extGame.externalId,
          leagueId,
          homeTeamId,
          awayTeamId,
          startTime,
          extGame.status,
          extGame.fieldName,
          extGame.rawData,
        );

        discoveredGames.push(discovered);
      } catch (error) {
        this.logger.error(
          `Failed to process game ${extGame.externalId}: ${error instanceof Error ? error.message : error}`,
        );
        // Continue with other games
      }
    }

    this.logger.log(
      `Successfully discovered ${discoveredGames.length} games for league ${league.name}`,
    );

    return discoveredGames;
  }

  /**
   * Find canonical team ID by external source
   */
  private async findCanonicalTeamId(
    provider: ProviderType,
    externalTeamId: string,
  ): Promise<string | undefined> {
    const externalSource = await this.externalTeamSourceRepo.findOne({
      where: { source: provider, externalId: externalTeamId },
    });

    return externalSource?.teamId;
  }

  /**
   * Parse game date and time into a Date object
   */
  private parseGameDateTime(date?: string, time?: string): Date | undefined {
    if (!date) return undefined;

    // UC format: date='YYYY-MM-DD', time='HH:mm:ss'
    const dateTimeStr = time ? `${date}T${time}` : `${date}T00:00:00`;

    try {
      return new Date(dateTimeStr);
    } catch {
      return undefined;
    }
  }

  /**
   * Map UC game status to canonical status
   */
  private mapGameStatus(
    ucStatus?: string,
  ): 'scheduled' | 'in_progress' | 'completed' | 'cancelled' {
    switch (ucStatus) {
      case 'scheduled':
        return 'scheduled';
      case 'in_progress':
        return 'in_progress';
      case 'has_outcome':
        return 'completed';
      case 'teams_not_set':
        return 'scheduled';
      default:
        return 'scheduled';
    }
  }

  /**
   * Upsert a single external game (de-dupe by provider + externalId).
   */
  private async upsertExternalGame(
    provider: ProviderType,
    externalId: string,
    leagueId: string,
    homeTeamId?: string,
    awayTeamId?: string,
    startTime?: Date,
    status?: string,
    fieldName?: string,
    rawData?: Record<string, unknown>,
  ): Promise<DiscoveredGame> {
    // Check if we already have an ExternalGameSource for this provider+externalId
    let externalSource = await this.externalGameSourceRepo.findOne({
      where: { source: provider, externalId },
      relations: ['game'],
    });

    let game: Game;

    if (externalSource) {
      // Update existing mirror
      externalSource.rawData = rawData || {};
      externalSource.lastSyncedAt = new Date();
      externalSource.syncStatus = 'active';
      await this.externalGameSourceRepo.save(externalSource);

      game = externalSource.game;

      // Update canonical game if isEditable=false (external games shouldn't be edited)
      if (!game.isEditable && startTime) {
        game.homeTeamId = homeTeamId;
        game.awayTeamId = awayTeamId;
        game.startTime = startTime;
        game.status = this.mapGameStatus(status);
        game.fieldName = fieldName;
        await this.gameRepo.save(game);
      }

      return {
        id: game.id,
        leagueId: game.leagueId,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        startTime: game.startTime,
        externalSource: {
          provider: externalSource.source,
          externalId: externalSource.externalId,
          lastSyncedAt: externalSource.lastSyncedAt,
        },
      };
    } else {
      // Create new canonical Game + ExternalGameSource
      if (!startTime) {
        throw new Error(`Cannot create game ${externalId} without startTime`);
      }

      game = this.gameRepo.create({
        leagueId,
        homeTeamId,
        awayTeamId,
        startTime,
        status: this.mapGameStatus(status),
        fieldName,
        sourceType: provider,
        isEditable: false, // External games are read-only
      });

      game = await this.gameRepo.save(game);

      // Create external source mirror
      externalSource = this.externalGameSourceRepo.create({
        gameId: game.id,
        source: provider,
        externalId,
        rawData: rawData || {},
        lastSyncedAt: new Date(),
        syncStatus: 'active',
      });

      await this.externalGameSourceRepo.save(externalSource);

      this.logger.log(
        `Created new game: ${game.homeTeamId || 'TBD'} vs ${game.awayTeamId || 'TBD'} at ${game.startTime?.toISOString() || 'unknown time'} (${game.id})`,
      );

      return {
        id: game.id,
        leagueId: game.leagueId,
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        startTime: game.startTime,
        externalSource: {
          provider: externalSource.source,
          externalId: externalSource.externalId,
          lastSyncedAt: externalSource.lastSyncedAt,
        },
      };
    }
  }

  /**
   * Check if games for a league are stale (>7 days since last sync).
   */
  async areGamesStale(leagueId: string): Promise<boolean> {
    const games = await this.gameRepo.find({
      where: { leagueId },
      relations: ['externalSources'],
    });

    if (games.length === 0) {
      return true; // No games = stale
    }

    const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

    // Check if any game has an external source that's stale
    for (const game of games) {
      const externalSource = game.externalSources?.[0];
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
