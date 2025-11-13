import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { IntegrationConnection } from './integration-connection.entity';
import { Organization } from './organization.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', nullable: true })
  passwordHash?: string;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'deleted'],
    default: 'active',
  })
  status: 'active' | 'suspended' | 'deleted';

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  lastLoginProvider?: string; // Track which integration they last used to log in

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  // Relationships
  @OneToOne(() => Profile, (profile) => profile.account, { cascade: true })
  profile?: Profile;

  @OneToMany(() => IntegrationConnection, (connection) => connection.account, {
    cascade: true,
  })
  integrationConnections: IntegrationConnection[];

  @ManyToOne(() => Organization, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'organizationId' })
  organization?: Organization;
}
