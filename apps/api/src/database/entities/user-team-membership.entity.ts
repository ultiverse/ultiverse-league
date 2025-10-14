import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Account } from './account.entity';
import { Team } from './team.entity';

@Entity('user_team_memberships')
@Unique(['userId', 'teamId'])
export class UserTeamMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  teamId: string;

  @Column({ nullable: true })
  role?: string;

  @Column({ nullable: true })
  joinedVia?: 'manual' | 'uc_import';

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: Account;

  @ManyToOne(() => Team, (team) => team.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teamId' })
  team: Team;
}
