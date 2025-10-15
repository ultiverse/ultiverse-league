import { Injectable } from '@nestjs/common';
import type { UserProfile, PastTeam } from '../integrations/ports/user.port';
import { ProfileService, UltiverseUserProfile } from './profile.service';
import { TeamsService } from '../teams/teams.service';
import { AccountsService } from '../integrations/accounts.service';

@Injectable()
export class UserService {
  constructor(
    private readonly profileService: ProfileService,
    private readonly teamsService: TeamsService,
    private readonly accountsService: AccountsService,
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
}
