import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import type { ProviderType } from '@ultiverse/shared-types';
import { League } from './league.entity';
import { Team } from './team.entity';
import { ExternalGameSource } from './external-game-source.entity';

@Entity('games')
export class Game {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  leagueId: string;

  // Flexible team assignment - can be single team or pod-based
  @Column({ type: 'uuid', nullable: true })
  homeTeamId?: string;

  @Column({ type: 'uuid', nullable: true })
  awayTeamId?: string;

  // For pod-based games: store array of team IDs per side
  @Column({ type: 'jsonb', nullable: true })
  homeTeamIds?: string[];

  @Column({ type: 'jsonb', nullable: true })
  awayTeamIds?: string[];

  @Column({ type: 'timestamptz' })
  startTime: Date;

  @Column({ type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ type: 'varchar', nullable: true })
  fieldName?: string;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'int', nullable: true })
  homeScore?: number;

  @Column({ type: 'int', nullable: true })
  awayScore?: number;

  @Column({ type: 'varchar', nullable: true })
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

  @Column({ type: 'varchar', default: 'ultiverse' })
  sourceType: ProviderType;

  @Column({ type: 'boolean', default: true })
  isEditable: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => League, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'leagueId' })
  league: League;

  // Single team relationships (for traditional games)
  @ManyToOne(() => Team, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homeTeamId' })
  homeTeam?: Team;

  @ManyToOne(() => Team, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'awayTeamId' })
  awayTeam?: Team;

  // Note: For pod games, use homeTeamIds/awayTeamIds arrays
  // and resolve teams separately via repository queries

  @OneToMany(() => ExternalGameSource, (source) => source.game)
  externalSources: ExternalGameSource[];
}
