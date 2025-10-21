import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Account } from './account.entity';
import { Player } from './player.entity';
import { Team } from './team.entity';
import { League } from './league.entity';

@Entity('memberships')
@Check('check_membership_identity', 'user_id IS NOT NULL OR player_id IS NOT NULL')
export class Membership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', nullable: true })
  playerId?: string;

  @Column({ type: 'uuid' })
  teamId: string;

  @Column({ type: 'uuid', nullable: true })
  leagueId?: string;

  @Column({ type: 'varchar', nullable: true })
  role?: string;

  @Column({ type: 'varchar', nullable: true })
  joinedVia?: 'manual' | 'uc_import' | 'zuluru_import';

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Account, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: Account;

  @ManyToOne(() => Player, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'playerId' })
  player?: Player;

  @ManyToOne(() => Team, (team) => team.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;

  @ManyToOne(() => League, (league) => league.memberships, { nullable: true })
  @JoinColumn({ name: 'leagueId' })
  league?: League;
}
