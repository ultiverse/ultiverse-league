import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, Profile } from '../database/entities';
import { AccountsService } from '../integrations/accounts.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { UCEnrichmentService } from '../integrations/uc/uc-enrichment.service';

export interface UltiverseUserProfile {
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  location?: string;
  bio?: string;
  preferences?: any;
  socialLinks?: any;
  // Integration-enriched data
  integrationData?: {
    [provider: string]: {
      externalId?: string;
      pastTeams?: any[];
      avatarUrls?: {
        small?: string;
        large?: string;
      };
      lastSeen?: string;
      enrichedAt?: Date;
    };
  };
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private accountsService: AccountsService,
    private integrationsService: IntegrationsService,
    private ucEnrichmentService: UCEnrichmentService,
  ) {}

  /**
   * Get user profile with Ultiverse as canonical source
   * Enriched with integration data where available
   */
  async getUserProfile(email: string): Promise<UltiverseUserProfile | null> {
    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      return null;
    }

    // Get Ultiverse profile (canonical)
    const profile = await this.profileRepository.findOne({
      where: { accountId: account.id },
    });

    // Get connected integrations
    const connections = await this.accountsService.getIntegrationConnections(account.id);

    // Build base profile from Ultiverse data
    const userProfile: UltiverseUserProfile = {
      email: account.email,
      firstName: profile?.firstName,
      lastName: profile?.lastName,
      displayName: profile?.displayName,
      avatarUrl: profile?.avatarUrl,
      phoneNumber: profile?.phoneNumber,
      dateOfBirth: profile?.dateOfBirth,
      location: profile?.location,
      bio: profile?.bio,
      preferences: profile?.preferences,
      socialLinks: profile?.socialLinks,
      integrationData: {},
    };

    // Enrich with integration data
    for (const connection of connections.filter(c => c.isConnected)) {
      if (connection.provider === 'uc') {
        const ucData = await this.ucEnrichmentService.getUserEnrichmentData();
        if (ucData) {
          userProfile.integrationData!.uc = ucData;
        }
      }
    }

    return userProfile;
  }

  /**
   * Enrich profile when a new integration is connected
   */
  async enrichProfileFromIntegration(accountId: string, provider: string): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { accountId },
    });

    if (provider === 'uc') {
      const ucData = await this.ucEnrichmentService.getUserEnrichmentData();
      if (ucData && profile) {
        // Update profile with UC data if Ultiverse fields are empty
        const updates: Partial<Profile> = {};

        if (!profile.firstName && ucData.firstName) {
          updates.firstName = ucData.firstName;
        }
        if (!profile.lastName && ucData.lastName) {
          updates.lastName = ucData.lastName;
        }
        if (!profile.avatarUrl && ucData.avatarUrls?.large) {
          updates.avatarUrl = ucData.avatarUrls.large;
        }
        if (!profile.displayName && (ucData.firstName || ucData.lastName)) {
          updates.displayName = `${ucData.firstName || ''} ${ucData.lastName || ''}`.trim();
        }

        if (Object.keys(updates).length > 0) {
          await this.profileRepository.update(
            { accountId },
            updates as any, // TypeORM type issue with complex nested properties
          );
        }
      }
    }
  }


  /**
   * Update user profile (Ultiverse canonical data)
   */
  async updateProfile(email: string, updates: Partial<Profile>): Promise<Profile | null> {
    const account = await this.accountsService.findByEmail(email);
    if (!account) {
      return null;
    }

    let profile = await this.profileRepository.findOne({
      where: { accountId: account.id },
    });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = this.profileRepository.create({
        accountId: account.id,
        ...updates,
      });
    } else {
      // Update existing profile
      Object.assign(profile, updates);
      profile.updatedAt = new Date();
    }

    return this.profileRepository.save(profile);
  }
}