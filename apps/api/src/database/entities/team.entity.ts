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
import { Organization } from './organization.entity';
import { League } from './league.entity';
import { Membership } from './membership.entity';
import { ExternalTeamSource } from './external-team-source.entity';

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'uuid', nullable: true })
  leagueId?: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'date' })
  seasonStart: Date;

  @Column({ type: 'date', nullable: true })
  seasonEnd?: Date;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId?: string;

  @Column({ type: 'varchar', default: 'ultiverse' })
  sourceType: 'ultiverse' | 'ultimate_central';

  @Column({ type: 'boolean', default: true })
  isEditable: boolean;

  @Column({ type: 'varchar', default: '#000000' })
  colour: string;

  @Column({ type: 'varchar', default: '#ffffff' })
  altColour: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => League, (league) => league.teams, { nullable: true })
  @JoinColumn({ name: 'leagueId' })
  league?: League;

  @ManyToOne(() => Account, { nullable: true })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy?: Account;

  @OneToMany(() => Membership, (membership) => membership.team)
  memberships: Membership[];

  @OneToMany(() => ExternalTeamSource, (source) => source.team)
  externalSources: ExternalTeamSource[];
}
