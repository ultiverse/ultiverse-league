import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Inject,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { FixturesService } from '../fixtures/fixtures.service';
import {
  LEAGUE_PROVIDER,
  TEAMS_PROVIDER,
  FIELDS_PROVIDER,
} from '../integrations/ports';
import type {
  ILeagueProvider,
  ITeamsProvider,
  IFieldsProvider,
} from '../integrations/ports';
import { LeagueDiscoveryService } from '../integrations/league-discovery.service';
import { ImportService } from '../imports/import.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  League,
  ExternalLeagueSource,
  IntegrationConnection,
  Team,
} from '../database/entities';

@Controller('leagues')
export class LeaguesController {
  private readonly logger = new Logger(LeaguesController.name);

  constructor(
    private fixtures: FixturesService,
    @Inject(LEAGUE_PROVIDER) private leagueProvider: ILeagueProvider,
    @Inject(TEAMS_PROVIDER) private teamsProvider: ITeamsProvider,
    @Inject(FIELDS_PROVIDER) private fieldsProvider: IFieldsProvider,
    private leagueDiscovery: LeagueDiscoveryService,
    private importService: ImportService,
    @InjectRepository(League)
    private readonly leagueRepo: Repository<League>,
    @InjectRepository(ExternalLeagueSource)
    private readonly externalSourceRepo: Repository<ExternalLeagueSource>,
    @InjectRepository(IntegrationConnection)
    private readonly integrationRepo: Repository<IntegrationConnection>,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  /**
   * GET /leagues
   * Return all discovered leagues for the current user's organization
   */
  @Get()
  async getAllLeagues() {
    this.logger.log('Getting all discovered leagues for user organization');

    // TODO: Get account from authentication
    const TEMP_ACCOUNT_ID = 'b935e0fb-4075-43af-b736-166001a32272';

    // Get all leagues that have been discovered
    const leagues = await this.leagueRepo
      .createQueryBuilder('league')
      .leftJoinAndSelect('league.organization', 'organization')
      .leftJoinAndSelect('league.externalSources', 'source')
      .innerJoin('league.organization', 'org')
      .innerJoin(
        'integration_connections',
        'conn',
        'conn."accountId" = :accountId AND league."organizationId" = org.id',
        { accountId: TEMP_ACCOUNT_ID },
      )
      .orderBy('league.seasonStart', 'DESC')
      .addOrderBy('league.seasonEnd', 'DESC')
      .getMany();

    this.logger.log(`Found ${leagues.length} leagues`);

    // Helper to safely convert date to ISO string
    const toISOString = (
      date: Date | string | null | undefined,
    ): string | undefined => {
      if (!date) return undefined;
      if (typeof date === 'string') return date;
      return date.toISOString();
    };

    // Map source type to badge
    const badgeMap: Record<string, 'UV' | 'UC' | 'Z'> = {
      ultiverse: 'UV',
      ultimate_central: 'UC',
      zuluru: 'Z',
    };

    return leagues.map((league) => {
      const source = league.externalSources?.[0];
      return {
        id: league.id,
        organization: {
          id: league.organization?.id || league.organizationId,
          name: league.organization?.name || 'Unknown',
        },
        name: league.name,
        seasonStart: toISOString(league.seasonStart),
        seasonEnd: toISOString(league.seasonEnd),
        source: league.sourceType,
        badge: badgeMap[league.sourceType] || 'UV',
        lastSyncedAt: toISOString(source?.lastSyncedAt),
        syncStatus: source?.syncStatus,
        roles: ['org_admin'], // For org-level admin view, all leagues are accessible
      };
    });
  }

  @Get('latest')
  async latest(@Query('integration') integration?: string) {
    if (integration === 'external') {
      try {
        const leagues = await this.leagueProvider.listRecent();
        return leagues[0] ?? null;
      } catch (error) {
        console.warn(
          'External integration not configured, falling back to fixtures:',
          error instanceof Error ? error.message : error,
        );
      }
    }
    return this.fixtures.getLeagues()[0] ?? null;
  }

  @Get('recent')
  async recent(
    @Query('limit') limit?: string,
    @Query('integration') integration?: string,
    @Query('order_by') orderBy?: string,
    @Query('start') start?: string,
  ) {
    const limitNum = limit ? Number(limit) : 10;

    if (integration === 'external') {
      try {
        const leagues = await this.leagueProvider.listRecent({
          limit: limitNum,
          order_by: orderBy,
          start: start,
        });
        return leagues;
      } catch (error) {
        // Fall back to fixture data if external integration is not configured
        console.warn(
          'External integration not configured, falling back to fixtures:',
          error instanceof Error ? error.message : error,
        );
      }
    }

    const rows = this.fixtures.getLeagues();
    return rows.slice(0, limitNum);
  }

  @Get(':id')
  async byId(
    @Param('id') id: string,
    @Query('integration') integration?: string,
  ) {
    if (integration === 'external') {
      return await this.leagueProvider.getLeagueById(id);
    }
    return this.fixtures.getLeagueById(id) ?? null;
  }

  @Get(':id/teams')
  async byIdTeams(
    @Param('id') id: string,
    @Query('pods') pods?: string,
    @Query('integration') integration?: string,
  ) {
    // First try to get teams from database
    const teams = await this.teamRepo.find({
      where: { leagueId: id },
      order: { name: 'ASC' },
    });

    if (teams.length > 0) {
      this.logger.log(
        `Found ${teams.length} teams for league ${id} in database`,
      );
      return teams.map((team) => ({
        id: team.id,
        name: team.name,
        location: team.location,
        colour: team.colour,
        altColour: team.altColour,
        seasonStart: team.seasonStart,
        seasonEnd: team.seasonEnd,
      }));
    }

    // Fallback to external integration if no teams in database
    if (integration === 'external') {
      try {
        const externalTeams = await this.teamsProvider.listTeams(id);
        return externalTeams;
      } catch (error) {
        console.warn(
          'External integration not configured, falling back to fixtures:',
          error instanceof Error ? error.message : error,
        );
      }
    }

    // Final fallback to fixtures
    const kind: 'pod' | undefined = pods === 'true' ? 'pod' : undefined;
    return this.fixtures.getTeams(id, kind);
  }

  @Get(':id/fields')
  async byIdFields(
    @Param('id') id: string,
    @Query('integration') integration?: string,
  ) {
    if (integration === 'external') {
      return await this.fieldsProvider.listFields(id);
    }

    // For now, return empty array for internal data
    // Later we can implement fixtures.getFields(id) if needed
    return [];
  }

  /**
   * POST /leagues/:id/refresh?force=true
   * On-demand refresh of external league data.
   * Returns 202 Accepted immediately and refreshes in background.
   * Use ?force=true to bypass staleness check and force refresh.
   */
  @Post(':id/refresh')
  @HttpCode(HttpStatus.ACCEPTED)
  async refreshLeague(
    @Param('id') leagueId: string,
    @Query('force') force?: string,
  ) {
    const forceRefresh = force === 'true';
    this.logger.log(
      `Refresh requested for league: ${leagueId}${forceRefresh ? ' (force)' : ''}`,
    );

    // Find the league and its external source
    const league = await this.leagueRepo.findOne({
      where: { id: leagueId },
      relations: ['externalSources'],
    });

    if (!league) {
      throw new NotFoundException(`League ${leagueId} not found`);
    }

    const externalSource = league.externalSources?.[0];
    if (!externalSource) {
      this.logger.warn(
        `League ${leagueId} is not an external league, skipping refresh`,
      );
      return {
        message: 'League is not from an external source',
        leagueId,
      };
    }

    // Check if the league is stale (>7 days) unless force refresh
    if (!forceRefresh) {
      const isStale = await this.leagueDiscovery.isLeagueStale(leagueId);

      if (!isStale) {
        const lastSynced = externalSource.lastSyncedAt
          ? externalSource.lastSyncedAt.toISOString()
          : 'never';
        this.logger.log(
          `League ${leagueId} is not stale (last synced: ${lastSynced}), skipping refresh`,
        );
        return {
          message: 'League data is already fresh',
          leagueId,
          lastSyncedAt: externalSource.lastSyncedAt,
        };
      }
    } else {
      this.logger.log(
        `Force refresh enabled, bypassing staleness check for league ${leagueId}`,
      );
    }

    // Get the account that has a connection for this provider
    const connection = await this.integrationRepo.findOne({
      where: {
        provider: externalSource.provider,
        isConnected: true,
      },
    });

    if (!connection) {
      this.logger.warn(
        `No active connection found for provider ${externalSource.provider}`,
      );
      return {
        message: `No active connection for provider ${externalSource.provider}`,
        leagueId,
      };
    }

    // Queue background refresh (for now, just run async)
    void this.performRefresh(
      connection.accountId,
      externalSource.provider,
      leagueId,
    );

    return {
      message: 'Refresh queued',
      leagueId,
      status: 'accepted',
    };
  }

  /**
   * Background refresh logic
   */
  private async performRefresh(
    accountId: string,
    provider: string,
    leagueId: string,
  ) {
    try {
      this.logger.log(
        `Starting background refresh for league ${leagueId} from provider ${provider}`,
      );

      // Use ImportService to refresh the league with full team/player data
      await this.importService.refreshLeague(leagueId);

      this.logger.log(
        `Successfully refreshed league ${leagueId} from provider ${provider}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to refresh league ${leagueId}: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
