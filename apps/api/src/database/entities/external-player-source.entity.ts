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
import { Player } from './player.entity';

@Entity('external_player_sources')
@Unique(['provider', 'externalId'])
export class ExternalPlayerSource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  playerId: string;

  @Column({ type: 'varchar' })
  provider: 'ultimate_central' | 'zuluru';

  @Column({ type: 'varchar' })
  externalId: string;

  @Column({ type: 'jsonb' })
  rawData: Record<string, unknown>;

  @Column({ type: 'varchar', nullable: true })
  etag?: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastSyncedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Player, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player: Player;
}
