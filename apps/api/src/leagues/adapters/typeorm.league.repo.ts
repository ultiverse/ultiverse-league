import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { League as DomainLeague } from '@ultiverse/shared-types';
import { LeagueRepository } from '../ports/league.repository';
import {
  League as LeagueEntity,
  ExternalLeagueSource,
} from '../../database/entities';

/**
 * TypeORM-based implementation of LeagueRepository.
 * Queries from canonical League table with ExternalLeagueSource metadata.
 */
@Injectable()
export class TypeOrmLeagueRepository implements LeagueRepository {
  constructor(
    @InjectRepository(LeagueEntity)
    private readonly leagueRepo: Repository<LeagueEntity>,
  ) {}

  async findLatest(): Promise<DomainLeague | null> {
    const league = await this.leagueRepo.findOne({
      where: {},
      order: { seasonStart: 'DESC' },
      relations: ['externalSources'],
    });

    return league ? this.toDomainLeague(league) : null;
  }

  async findRecent(limit: number): Promise<DomainLeague[]> {
    const leagues = await this.leagueRepo.find({
      order: { seasonStart: 'DESC' },
      take: limit,
      relations: ['externalSources'],
    });

    return leagues.map((league) => this.toDomainLeague(league));
  }

  async findById(id: string): Promise<DomainLeague | null> {
    const league = await this.leagueRepo.findOne({
      where: { id },
      relations: ['externalSources'],
    });

    return league ? this.toDomainLeague(league) : null;
  }

  /**
   * Transform database entity to domain model.
   * Includes external source metadata in externalRefs.
   */
  private toDomainLeague(entity: LeagueEntity): DomainLeague {
    const externalSource = entity.externalSources?.[0]; // Get first external source

    return {
      id: entity.id,
      orgId: entity.organizationId,
      name: entity.name,
      start: entity.seasonStart?.toISOString(),
      end: entity.seasonEnd?.toISOString(),
      type: 'league',
      externalRefs: externalSource
        ? {
            [externalSource.provider]: {
              externalId: externalSource.externalId,
              lastSyncedAt: externalSource.lastSyncedAt?.toISOString(),
              syncStatus: externalSource.syncStatus,
            },
          }
        : undefined,
      meta: {
        sourceType: entity.sourceType,
        isEditable: entity.isEditable,
        visibility: entity.visibility,
      },
    };
  }
}
