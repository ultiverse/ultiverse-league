import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('integration_connections')
@Index(['accountId', 'provider'], { unique: true }) // One connection per provider per account
export class IntegrationConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  accountId: string;

  @Column({ type: 'varchar' })
  provider: string; // 'ultimate_central', 'zuluru', etc.

  @Column({ type: 'boolean', default: false })
  isConnected: boolean;

  @Column({
    type: 'enum',
    enum: ['connected', 'disconnected', 'error', 'pending'],
    default: 'disconnected',
  })
  status: 'connected' | 'disconnected' | 'error' | 'pending';

  @Column({ type: 'varchar', nullable: true })
  externalUserId?: string; // The user ID from the external provider

  @Column({ type: 'varchar', nullable: true })
  connectedEmail?: string;

  @Column({ type: 'timestamp', nullable: true })
  connectedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSyncAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  // Encrypted credentials storage
  @Column({ type: 'text', nullable: true })
  encryptedAccessToken?: string;

  @Column({ type: 'text', nullable: true })
  encryptedRefreshToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  tokenExpiresAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  providerData?: Record<string, unknown>; // Store provider-specific data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Account, (account) => account.integrationConnections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'accountId' })
  account: Account;
}
