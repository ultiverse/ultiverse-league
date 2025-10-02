import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Account } from './account.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  accountId: string;

  @Column({ nullable: true })
  firstName?: string;

  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences?: Record<string, unknown>;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks?: Record<string, string>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => Account, (account) => account.profile)
  @JoinColumn({ name: 'accountId' })
  account: Account;
}