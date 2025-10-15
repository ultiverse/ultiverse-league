import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { LeaguesModule } from './leagues/leagues.module';
import { TeamsModule } from './teams/teams.module';
import { PlayersModule } from './players/players.module';
import { GamesModule } from './games/games.module';
import { ExportsModule } from './exports/exports.module';
import { FixturesModule } from './fixtures/fixtures.module';
import { SchedulesModule } from './schedules/schedules.module';
import { UserModule } from './user/user.module';
import { FieldsModule } from './fields/fields.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { getDatabaseConfig } from './database/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    CoreModule,
    LeaguesModule,
    TeamsModule,
    PlayersModule,
    GamesModule,
    ExportsModule,
    FixturesModule,
    SchedulesModule,
    UserModule,
    FieldsModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
