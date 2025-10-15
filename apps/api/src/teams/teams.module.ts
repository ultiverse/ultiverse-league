import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Team,
  UserTeamMembership,
  ExternalTeamSource,
} from '../database/entities';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, UserTeamMembership, ExternalTeamSource]),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
