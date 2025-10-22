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
import { Organization } from './organization.entity';
import { Team } from './team.entity';
import { ExternalLeagueSource } from './external-league-source.entity';
import { Membership } from './membership.entity';

@Entity('leagues')
export class League {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'date', nullable: true })
  seasonStart?: Date;

  @Column({ type: 'date', nullable: true })
  seasonEnd?: Date;

  @Column({ type: 'varchar', default: 'ultiverse' })
  sourceType: ProviderType;

  @Column({ type: 'boolean', default: true })
  isEditable: boolean;

  @Column({ type: 'varchar', default: 'public' })
  visibility: 'public' | 'private';

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Organization, (organization) => organization.leagues)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @OneToMany(() => Team, (team) => team.league)
  teams: Team[];

  @OneToMany(() => ExternalLeagueSource, (source) => source.league)
  externalSources: ExternalLeagueSource[];

  @OneToMany(() => Membership, (membership) => membership.league)
  memberships: Membership[];
}
