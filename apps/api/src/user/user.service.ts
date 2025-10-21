import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { UserProfile, PastTeam } from '../integrations/ports/user.port';
import { ProfileService, UltiverseUserProfile } from './profile.service';
import { TeamsService } from '../teams/teams.service';
import { AccountsService } from '../integrations/accounts.service';
import {
  League,
  ExternalLeagueSource,
  Membership,
  IntegrationConnection,
} from '../database/entities';
import { ImportService } from '../imports/import.service';

export interface MeLeagueResponse {
  id: string;
  organization: {
    id: string;
    name: string;
  };
  name: string;
  seasonStart?: string;
  seasonEnd?: string;
  source: 'ultiverse' | 'ultimate_central' | 'zuluru';
  badge: 'UV' | 'UC' | 'Z';
  lastSyncedAt?: string;
  syncStatus?: string;
  roles: string[];
}

export interface MeConnectionResponse {
  provider: string;
  status: 'active' | 'not_connected';
  connectedEmail?: string;
  connectedAt?: string;
  lastSyncAt?: string;
}

export interface MeLeaguesResponse {
  leagues: MeLeagueResponse[];
  connections: MeConnectionResponse[];
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly profileService: ProfileService,
    private readonly teamsService: TeamsService,
    private readonly accountsService: AccountsService,
    @InjectRepository(League)
    private readonly leagueRepo: Repository<League>,
    @InjectRepository(ExternalLeagueSource)
    private readonly leagueSourceRepo: Repository<ExternalLeagueSource>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(IntegrationConnection)
    private readonly integrationRepo: Repository<IntegrationConnection>,
    private readonly importService: ImportService,
  ) {}

  async getCurrentUser(): Promise<UserProfile | null> {
    // Use hardcoded email for now - in real implementation this would come from authentication
    const email = 'greg@gregpike.ca';
    const ultiverseProfile = await this.profileService.getUserProfile(email);

    if (!ultiverseProfile) {
      return null;
    }

    // Get account to access accountId
    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      return null;
    }

    // Transform UltiverseUserProfile to the expected UserProfile format
    return this.transformToUserProfile(ultiverseProfile, account.id);
  }

  private async transformToUserProfile(
    ultiverseProfile: UltiverseUserProfile,
    accountId: string,
  ): Promise<UserProfile> {
    const ucData = ultiverseProfile.integrationData?.uc;

    // Get past teams from the canonical teams schema
    const teams = await this.teamsService.getUserTeams(accountId);

    // Transform teams to PastTeam format
    const pastTeams: PastTeam[] = teams.map((team) => ({
      id: team.id,
      name: team.name,
      division: null, // Not tracked in canonical schema yet
      colour: team.colour,
      altColour: team.altColour,
      dateJoined: team.seasonStart.toISOString(),
      monthYear: this.formatMonthYear(team.seasonStart),
      source: team.sourceType === 'ultimate_central' ? 'uc' : 'ultiverse',
    }));

    return {
      email: ultiverseProfile.email,
      firstName: ultiverseProfile.firstName || '',
      lastName: ultiverseProfile.lastName || '',
      integration: ucData ? 'uc' : 'native',
      pastTeams,
      lastLogin: ucData?.lastSeen || new Date().toISOString(),
      identifies: 'not_defined', // Will be enhanced with proper mapping later
      avatarSmall: ucData?.avatarUrls?.small || ultiverseProfile.avatarUrl,
      avatarLarge: ucData?.avatarUrls?.large || ultiverseProfile.avatarUrl,
    };
  }

  private formatMonthYear(date: Date): string {
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }

  /**
   * Get all leagues accessible to a user
   * Supports optional staleness-based refresh
   */
  async getMyLeagues(
    userId: string,
    opts?: { fresh?: 'if-stale' | 'force' },
  ): Promise<MeLeaguesResponse> {
    this.logger.log(`Getting leagues for user ${userId}`);

    // 1) Get canonical leagues where user has memberships
    const leagues = await this.leagueRepo
      .createQueryBuilder('league')
      .leftJoinAndSelect('league.organization', 'organization')
      .leftJoinAndSelect('league.externalSources', 'source')
      .innerJoin('league.teams', 'team')
      .innerJoin('team.memberships', 'membership')
      .where('membership.userId = :userId', { userId })
      .andWhere('membership.isActive = :isActive', { isActive: true })
      .orderBy('league.seasonStart', 'DESC')
      .addOrderBy('league.seasonEnd', 'DESC')
      .getMany();

    this.logger.log(`Found ${leagues.length} leagues for user`);

    // 2) Check staleness and refresh if needed
    if (opts?.fresh === 'if-stale' || opts?.fresh === 'force') {
      await this.refreshStaleLeagues(leagues, opts.fresh === 'force');
    }

    // 3) Get integration connections
    const connections = await this.integrationRepo.find({
      where: { accountId: userId },
    });

    // 4) Format response
    return {
      leagues: leagues.map((league) => this.formatLeague(league)),
      connections: connections.map((conn) => this.formatConnection(conn)),
    };
  }

  /**
   * Refresh stale leagues
   */
  private async refreshStaleLeagues(
    leagues: League[],
    force: boolean,
  ): Promise<void> {
    for (const league of leagues) {
      const source = league.externalSources?.[0];
      if (!source) continue;

      const isStale = this.importService.isLeagueStale(source.lastSyncedAt);

      if (force || isStale) {
        this.logger.log(
          `Refreshing ${force ? 'forced' : 'stale'} league: ${league.name} (${league.id})`,
        );
        try {
          await this.importService.refreshLeague(league.id);
        } catch (error) {
          this.logger.error(
            `Failed to refresh league ${league.id}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          // Continue with other leagues even if one fails
        }
      }
    }
  }

  /**
   * Format a league for the response
   */
  private formatLeague(league: League): MeLeagueResponse {
    const source = league.externalSources?.[0];

    // Map source type to badge
    const badgeMap: Record<string, 'UV' | 'UC' | 'Z'> = {
      ultiverse: 'UV',
      ultimate_central: 'UC',
      zuluru: 'Z',
    };

    return {
      id: league.id,
      organization: {
        id: league.organization?.id || league.organizationId,
        name: league.organization?.name || 'Unknown',
      },
      name: league.name,
      seasonStart: league.seasonStart?.toISOString(),
      seasonEnd: league.seasonEnd?.toISOString(),
      source: league.sourceType,
      badge: badgeMap[league.sourceType] || 'UV',
      lastSyncedAt: source?.lastSyncedAt?.toISOString(),
      syncStatus: source?.syncStatus,
      roles: ['player'], // TODO: Extract actual roles from memberships
    };
  }

  /**
   * Format a connection for the response
   */
  private formatConnection(conn: IntegrationConnection): MeConnectionResponse {
    return {
      provider: conn.provider,
      status: conn.isConnected ? 'active' : 'not_connected',
      connectedEmail: conn.connectedEmail || undefined,
      connectedAt: conn.connectedAt?.toISOString(),
      lastSyncAt: conn.lastSyncAt?.toISOString(),
    };
  }
}
