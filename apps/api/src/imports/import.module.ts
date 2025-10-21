import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  League,
  ExternalLeagueSource,
  Team,
  ExternalTeamSource,
  Membership,
  Organization,
} from '../database/entities';
import { ImportService } from './import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      League,
      ExternalLeagueSource,
      Team,
      ExternalTeamSource,
      Membership,
      Organization,
    ]),
  ],
  providers: [ImportService],
  exports: [ImportService],
})
export class ImportModule {}
