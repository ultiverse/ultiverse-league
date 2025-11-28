import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UCRegistrationsService } from '../uc.registrations/uc.registrations.service';
import { Team, League, ExternalLeagueSource } from '../../../database/entities';

export interface UCPlayerRoster {
  personId: number;
  teamId: number;
  internalTeamId?: string; // Mapped internal team ID
  fullName?: string;
  email?: string;
  rawData: Record<string, unknown>;
}

/**
 * Service for discovering player rosters from Ultimate Central
 */
@Injectable()
export class UCPlayersService {
  private readonly logger = new Logger(UCPlayersService.name);

  constructor(
    private readonly registrationsService: UCRegistrationsService,
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
  ) {}

  /**
   * Fetch all players for a league with internal team ID mapping
   */
  async listPlayersForLeague(leagueId: string): Promise<UCPlayerRoster[]> {
    this.logger.log(`Fetching players for league ${leagueId}`);

    // Get league and event ID
    const league = (await this.teamRepo.manager.findOne('leagues', {
      where: { id: leagueId },
      relations: ['externalSources'],
    })) as (League & { externalSources: ExternalLeagueSource[] }) | null;

    if (!league) {
      throw new Error(`League ${leagueId} not found`);
    }

    const leagueSource = league.externalSources?.find(
      (s) => s.provider === 'uc',
    );

    if (!leagueSource) {
      throw new Error(`No UC external source found for league ${leagueId}`);
    }

    const eventId = Number(leagueSource.externalId);

    // Fetch all registrations
    const response = await this.registrationsService.list(eventId, {
      includePerson: true,
      includeTeam: true,
      perPage: 100,
    });

    this.logger.log(
      `Fetched ${response.result.length} registrations from UC event ${eventId}`,
    );

    // Get teams and create mapping
    const teams = await this.teamRepo.find({
      where: { leagueId },
      relations: ['externalSources'],
    });

    const teamIdMap = new Map<number, string>();
    for (const team of teams) {
      const teamSource = team.externalSources?.find(
        (s) => s.source === 'uc',
      );
      if (teamSource) {
        teamIdMap.set(Number(teamSource.externalId), team.id);
      }
    }

    // Map registrations with internal team IDs
    return response.result
      .filter((reg) => reg.Person && reg.team_id != null)
      .map((reg) => ({
        personId: reg.person_id,
        teamId: reg.team_id as number,
        internalTeamId: teamIdMap.get(reg.team_id as number),
        fullName:
          reg.Person!.full_name ||
          `${reg.Person!.first_name || ''} ${reg.Person!.last_name || ''}`.trim(),
        email: reg.Person!.email_address || reg.Person!.email_canonical,
        rawData: { ...reg.Person },
      }));
  }

  /**
   * Fetch all players/registrations for an entire event (league)
   * This is more efficient than fetching per-team
   */
  async listPlayersForEvent(eventId: number): Promise<UCPlayerRoster[]> {
    this.logger.log(`Fetching all registrations for UC event ${eventId}`);

    const response = await this.registrationsService.list(eventId, {
      includePerson: true,
      includeTeam: true,
      perPage: 100,
    });

    this.logger.log(
      `Fetched ${response.result.length} registrations from UC event ${eventId}`,
    );

    return response.result
      .filter((reg) => reg.Person && reg.team_id != null)
      .map((reg) => ({
        personId: reg.person_id,
        teamId: reg.team_id as number,
        fullName:
          reg.Person!.full_name ||
          `${reg.Person!.first_name || ''} ${reg.Person!.last_name || ''}`.trim(),
        email: reg.Person!.email_address || reg.Person!.email_canonical,
        rawData: { ...reg.Person },
      }));
  }

  /**
   * Fetch players for a specific team
   */
  async listPlayersForTeam(
    eventId: number,
    teamId: number,
  ): Promise<UCPlayerRoster[]> {
    this.logger.log(
      `Fetching registrations for UC event ${eventId}, team ${teamId}`,
    );

    const response = await this.registrationsService.list(eventId, {
      includePerson: true,
      includeTeam: true,
      teamId,
      perPage: 100,
    });

    this.logger.log(
      `Fetched ${response.result.length} registrations for team ${teamId}`,
    );

    return response.result
      .filter((reg) => reg.Person)
      .map((reg) => ({
        personId: reg.person_id,
        teamId: (reg.team_id ?? teamId) as number,
        fullName:
          reg.Person!.full_name ||
          `${reg.Person!.first_name || ''} ${reg.Person!.last_name || ''}`.trim(),
        email: reg.Person!.email_address || reg.Person!.email_canonical,
        rawData: { ...reg.Person },
      }));
  }
}
