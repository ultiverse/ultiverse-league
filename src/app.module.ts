import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { LeaguesModule } from './leagues/leagues.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { GamesModule } from './games/games.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { ExportsModule } from './exports/exports.module';

@Module({
  imports: [
    CoreModule,
    LeaguesModule,
    TeamsModule,
    PlayersModule,
    GamesModule,
    SchedulingModule,
    IntegrationsModule,
    ExportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
