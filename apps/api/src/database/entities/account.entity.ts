import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
import { Profile } from './profile.entity';
import { IntegrationConnection } from './integration-connection.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  passwordHash?: string;

  @Column({
    type: 'enum',
    enum: ['active', 'suspended', 'deleted'],
    default: 'active',
  })
  status: 'active' | 'suspended' | 'deleted';

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  lastLoginProvider?: string; // Track which integration they last used to log in

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
}
