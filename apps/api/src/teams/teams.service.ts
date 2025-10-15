import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Team,
  UserTeamMembership,
  ExternalTeamSource,
} from '../database/entities';

export interface ExternalTeamData {
  externalId: string;
  source: 'ultimate_central' | 'zuluru';
  name: string;
  location?: string;
  seasonStart: Date;
  seasonEnd?: Date;
  colour?: string;
  altColour?: string;
  rawData: Record<string, unknown>;
}

export interface TeamWithSource extends Team {
  lastSyncedAt?: Date;
  syncStatus?: string;
}

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(UserTeamMembership)
    private membershipsRepository: Repository<UserTeamMembership>,
    @InjectRepository(ExternalTeamSource)
    private externalSourcesRepository: Repository<ExternalTeamSource>,
  ) {}

  /**
   * Import an external team with deduplication
   * Returns the canonical team_id (reuses existing or creates new)
   */
  async importExternalTeam(
    userId: string,
    organizationId: string,
    externalTeam: ExternalTeamData,
  ): Promise<string> {
    // Step 1: Check if this external team already exists
    const existingSource = await this.externalSourcesRepository.findOne({
      where: {
        source: externalTeam.source,
        externalId: externalTeam.externalId,
      },
      relations: ['team'],
    });

    let teamId: string;

    if (existingSource) {
      // Team already exists - reuse it
      teamId = existingSource.teamId;
      this.logger.log(
        `Reusing existing team ${teamId} for ${externalTeam.source}:${externalTeam.externalId}`,
      );

      // Update the external source with fresh data
      existingSource.rawData = externalTeam.rawData;
      existingSource.lastSyncedAt = new Date();
      existingSource.syncStatus = 'active';
      await this.externalSourcesRepository.save(existingSource);
    } else {
      // Team doesn't exist - create new canonical team
      const newTeam = this.teamsRepository.create({
        organizationId,
        name: externalTeam.name,
        location: externalTeam.location,
        seasonStart: externalTeam.seasonStart,
        seasonEnd: externalTeam.seasonEnd,
        sourceType:
          externalTeam.source === 'ultimate_central'
            ? 'ultimate_central'
            : 'ultiverse',
        isEditable: false, // External teams are read-only
        colour: externalTeam.colour || '#000000',
        altColour: externalTeam.altColour || '#ffffff',
      });

      const savedTeam = await this.teamsRepository.save(newTeam);
      teamId = savedTeam.id;

      // Create external source record
      const externalSource = this.externalSourcesRepository.create({
        teamId,
        source: externalTeam.source,
        externalId: externalTeam.externalId,
        lastSyncedAt: new Date(),
        syncStatus: 'active',
      });
      externalSource.rawData = externalTeam.rawData;

      await this.externalSourcesRepository.save(externalSource);

      this.logger.log(
        `Created new team ${teamId} from ${externalTeam.source}:${externalTeam.externalId}`,
      );
    }

    // Step 2: Link user to team (idempotent with ON CONFLICT DO NOTHING)
    const existingMembership = await this.membershipsRepository.findOne({
      where: { userId, teamId },
    });

    if (!existingMembership) {
      const membership = this.membershipsRepository.create({
        userId,
        teamId,
        role: 'player',
        joinedVia: `${externalTeam.source}_import` as any,
      });

      await this.membershipsRepository.save(membership);
      this.logger.log(`Linked user ${userId} to team ${teamId}`);
    }

    return teamId;
  }

  /**
   * Get all teams for a user, sorted by season
   */
  async getUserTeams(userId: string): Promise<TeamWithSource[]> {
    const memberships = await this.membershipsRepository.find({
      where: { userId },
      relations: ['team', 'team.externalSources'],
      order: {
        team: {
          seasonStart: 'DESC',
          seasonEnd: 'DESC',
        },
      },
    });

    return memberships.map((membership) => {
      const team = membership.team;
      const externalSource = team.externalSources?.[0];

      return {
        ...team,
        lastSyncedAt: externalSource?.lastSyncedAt,
        syncStatus: externalSource?.syncStatus,
      };
    });
  }

  /**
   * Refresh a team from its external source
   * (For future use - manual refresh button)
   */
  async refreshExternalTeam(teamId: string): Promise<void> {
    const externalSource = await this.externalSourcesRepository.findOne({
      where: { teamId },
    });

    if (!externalSource) {
      throw new Error('Team has no external source');
    }

    // TODO: Implement conditional GET with etag/last_modified
    // For now, just update the sync timestamp
    await this.externalSourcesRepository.update(externalSource.id, {
      lastSyncedAt: new Date(),
      syncStatus: 'active',
    });
  }

  /**
   * Check if a team needs refresh (older than 7 days)
   */
  isStale(team: TeamWithSource): boolean {
    if (!team.lastSyncedAt) return false;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return team.lastSyncedAt < sevenDaysAgo;
  }
}
