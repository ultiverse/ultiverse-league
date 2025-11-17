import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team, Membership } from '../database/entities';

@Controller('teams')
export class TeamsController {
  constructor(
    @InjectRepository(Team)
    private readonly teamRepo: Repository<Team>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
  ) {}

  /**
   * GET /teams/:id
   * Fetch team details including metadata and external source info
   */
  @Get(':id')
  async getTeamById(@Param('id') id: string) {
    const team = await this.teamRepo.findOne({
      where: { id },
      relations: ['externalSources'],
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  /**
   * GET /teams/:id/players
   * Fetch roster (all active players) for a team
   */
  @Get(':id/players')
  async getTeamRoster(@Param('id') teamId: string) {
    // First verify the team exists
    const team = await this.teamRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Get all active memberships for this team with player details
    const memberships = await this.membershipRepo.find({
      where: { teamId, isActive: true },
      relations: ['player', 'player.externalSources'],
      order: { player: { fullName: 'ASC' } },
    });

    // Transform to include player info with membership details
    return memberships
      .filter((membership) => membership.player) // Filter out memberships without player data
      .map((membership) => ({
        id: membership.id,
        playerId: membership.player!.id,
        fullName: membership.player!.fullName,
        primaryEmail: membership.player!.primaryEmail,
        role: membership.role,
        joinedVia: membership.joinedVia,
        externalSources: membership.player!.externalSources,
      }));
  }
}
