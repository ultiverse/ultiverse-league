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
import { Account } from './account.entity';
import { UserTeamMembership } from './user-team-membership.entity';
import { ExternalTeamSource } from './external-team-source.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ type: 'date' })
  seasonStart: Date;

  @Column({ type: 'date', nullable: true })
  seasonEnd?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Column({ default: 'ultiverse' })
  sourceType: 'ultiverse' | 'ultimate_central';

  @Column({ default: true })
  isEditable: boolean;

  @Column({ default: '#000000' })
  colour: string;

  @Column({ default: '#ffffff' })
  altColour: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: Account;

  @OneToMany(() => UserTeamMembership, (membership) => membership.team)
  memberships: UserTeamMembership[];

  @OneToMany(() => ExternalTeamSource, (source) => source.team)
  externalSources: ExternalTeamSource[];
}
