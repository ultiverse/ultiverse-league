import { Injectable } from '@nestjs/common';
import type { UserProfile } from '../integrations/ports/user.port';
import { ProfileService, UltiverseUserProfile } from './profile.service';

@Injectable()
export class UserService {
  constructor(private readonly profileService: ProfileService) {}

  async getCurrentUser(): Promise<UserProfile | null> {
    // Use hardcoded email for now - in real implementation this would come from authentication
    const ultiverseProfile =
      await this.profileService.getUserProfile('greg@gregpike.ca');

    if (!ultiverseProfile) {
      return null;
    }

    // Transform UltiverseUserProfile to the expected UserProfile format
    return this.transformToUserProfile(ultiverseProfile);
  }

  private transformToUserProfile(
    ultiverseProfile: UltiverseUserProfile,
  ): UserProfile {
    const ucData = ultiverseProfile.integrationData?.uc;

    return {
      email: ultiverseProfile.email,
      firstName: ultiverseProfile.firstName || '',
      lastName: ultiverseProfile.lastName || '',
      integration: ucData ? 'uc' : 'native',
      pastTeams: ucData?.pastTeams || [],
      lastLogin: ucData?.lastSeen || new Date().toISOString(),
      identifies: 'not_defined', // Will be enhanced with proper mapping later
      avatarSmall: ucData?.avatarUrls?.small || ultiverseProfile.avatarUrl,
      avatarLarge: ucData?.avatarUrls?.large || ultiverseProfile.avatarUrl,
    };
  }
}
