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
import type { ProviderType } from '@ultiverse/shared-types';
import { Game } from './game.entity';

@Entity('external_game_sources')
@Unique(['source', 'externalId'])
export class ExternalGameSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  gameId: string;

  @Column({ type: 'varchar' })
  source: ProviderType;

  @Column({ type: 'varchar' })
  externalId: string;

  @Column({ type: 'jsonb' })
  rawData: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  syncStatus?: 'active' | 'stale' | 'error';

  @Column({ type: 'varchar', nullable: true })
  etag?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastModified?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Game, (game) => game.externalSources, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'gameId' })
  game: Game;
}
