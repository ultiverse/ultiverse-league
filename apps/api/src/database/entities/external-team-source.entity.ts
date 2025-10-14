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
import { Team } from './team.entity';

@Entity('external_team_sources')
@Unique(['source', 'externalId'])
export class ExternalTeamSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  teamId: string;

  @Column()
  source: 'ultimate_central' | 'zuluru';

  @Column()
  externalId: string;

  @Column({ type: 'jsonb' })
  rawData: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @Column({ nullable: true })
  syncStatus?: 'active' | 'stale' | 'error';

  @Column({ nullable: true })
  etag?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastModified?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Team, (team) => team.externalSources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'teamId' })
  team: Team;
}
