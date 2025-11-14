import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ProfileService } from './profile.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { UCModule } from '../integrations/uc/uc.module';
import { UCEnrichmentService } from '../integrations/uc/uc-enrichment.service';
import { TeamsModule } from '../teams/teams.module';
import { ImportModule } from '../imports/import.module';
import {
  Profile,
  League,
  ExternalLeagueSource,
  Membership,
  IntegrationConnection,
} from '../database/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Profile,
      League,
      ExternalLeagueSource,
      Membership,
      IntegrationConnection,
    ]),
    IntegrationsModule,
    UCModule,
    TeamsModule,
    ImportModule,
  ],
  controllers: [UserController],
  providers: [UserService, ProfileService, UCEnrichmentService],
  exports: [UserService, ProfileService],
})
export class UserModule {}
