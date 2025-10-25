import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaguesController } from './leagues.controller';
import { LeaguesService } from './leagues.service';
import { LEAGUE_REPO } from './ports/league.repository';
import { TypeOrmLeagueRepository } from './adapters/typeorm.league.repo';
import { FixturesService } from 'src/fixtures/fixtures.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { ImportModule } from '../imports/import.module';
import {
  League,
  ExternalLeagueSource,
  IntegrationConnection,
  Team,
} from '../database/entities';

@Module({
  imports: [
    IntegrationsModule,
    ImportModule,
    TypeOrmModule.forFeature([
      League,
      ExternalLeagueSource,
      IntegrationConnection,
      Team,
    ]),
  ],
  controllers: [LeaguesController],
  providers: [
    LeaguesService,
    FixturesService,
    { provide: LEAGUE_REPO, useClass: TypeOrmLeagueRepository },
  ],
  exports: [LeaguesService, FixturesService],
})
export class LeaguesModule {}
