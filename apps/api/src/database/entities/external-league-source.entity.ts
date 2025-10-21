import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { League } from './league.entity';

@Entity('external_league_sources')
@Unique(['provider', 'externalId'])
export class ExternalLeagueSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leagueId: string;

  @Column({ type: 'varchar' })
  provider: 'ultimate_central' | 'zuluru';

  @Column({ type: 'varchar' })
  externalId: string;

  @Column({ type: 'jsonb' })
  rawData: Record<string, unknown>;

  @Column({ type: 'varchar', nullable: true })
  etag?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastModifiedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  syncStatus?: 'active' | 'stale' | 'error';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => League, (league) => league.externalSources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'leagueId' })
  league: League;
}
