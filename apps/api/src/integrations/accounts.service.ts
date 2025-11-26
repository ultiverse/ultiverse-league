import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Account,
  Profile,
  IntegrationConnection,
  Organization,
} from '../database/entities';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(IntegrationConnection)
    private integrationsRepository: Repository<IntegrationConnection>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
  ) {}

  /**
   * Create a new account with profile via integration
   */
  async createAccountFromIntegration(
    email: string,
    provider: string,
    externalUserId: string,
    profileData?: Partial<Profile>,
  ): Promise<Account> {
    // Create account WITHOUT organization initially
    // Organization will be set when user connects an integration (UC, Zuluru, etc.)
    const account = this.accountsRepository.create({
      email,
      organizationId: undefined, // Will be set when connecting integration
      lastLoginProvider: provider,
      lastLoginAt: new Date(),
      status: 'active',
    });

    const savedAccount = await this.accountsRepository.save(account);

    // Create profile
    const profile = this.profilesRepository.create({
      accountId: savedAccount.id,
      ...profileData,
    });

    await this.profilesRepository.save(profile);

    // Create integration connection only for actual integrations (not email login)
    if (provider !== 'email') {
      const connection = this.integrationsRepository.create({
        accountId: savedAccount.id,
        provider,
        externalUserId,
        isConnected: true,
        status: 'connected',
        connectedEmail: email,
        connectedAt: new Date(),
      });

      await this.integrationsRepository.save(connection);
    }

    return savedAccount;
  }

  /**
   * Set or update organization for an account based on UC domain
   * Extracts organization name from UC API domain (e.g., "maul.usetopscore.com" -> "MAUL")
   */
  async setOrganizationFromDomain(
    accountId: string,
    domain: string,
  ): Promise<void> {
    // Extract org name from domain
    // Domain format: https://[org].usetopscore.com or [org].usetopscore.com
    const cleanDomain = domain.replace(/^https?:\/\//, ''); // Remove protocol
    const match = cleanDomain.match(/^([^.]+)\.usetopscore\.com/);

    if (!match) {
      console.warn(`Could not extract organization from domain: ${domain}`);
      return;
    }

    const orgSlug = match[1]; // e.g., "maul"
    const orgName = orgSlug.toUpperCase(); // e.g., "MAUL"

    // Find or create organization
    let organization = await this.organizationsRepository.findOne({
      where: { name: orgName },
    });

    if (!organization) {
      organization = await this.organizationsRepository.save(
        this.organizationsRepository.create({ name: orgName }),
      );
    }

    // Update account with organization
    await this.accountsRepository.update(accountId, {
      organizationId: organization.id,
    });
  }

  /**
   * Find account by email
   */
  async findByEmail(email: string): Promise<Account | null> {
    try {
      const account = await this.accountsRepository.findOne({
        where: { email },
      });
      console.log('Account found:', account);
      return account;
    } catch (error) {
      console.error('Error finding account by email:', error);
      return null;
    }
  }

  /**
   * Find account by integration connection
   */
  async findByIntegration(
    provider: string,
    externalUserId: string,
  ): Promise<Account | null> {
    const connection = await this.integrationsRepository.findOne({
      where: { provider, externalUserId },
      relations: ['account', 'account.profile'],
    });

    return connection?.account || null;
  }

  /**
   * Update last login information
   */
  async updateLastLogin(accountId: string, provider: string): Promise<void> {
    await this.accountsRepository.update(accountId, {
      lastLoginAt: new Date(),
      lastLoginProvider: provider,
    });
  }

  /**
   * Get all integration connections for an account
   */
  async getIntegrationConnections(
    accountId: string,
  ): Promise<IntegrationConnection[]> {
    return this.integrationsRepository.find({
      where: { accountId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Update integration connection
   */
  async updateIntegrationConnection(
    accountId: string,
    provider: string,
    updates: Partial<IntegrationConnection>,
  ): Promise<IntegrationConnection> {
    let connection = await this.integrationsRepository.findOne({
      where: { accountId, provider },
    });

    if (!connection) {
      // Create new connection if it doesn't exist
      connection = this.integrationsRepository.create({
        accountId,
        provider,
        ...updates,
      });
    } else {
      // Update existing connection
      Object.assign(connection, updates);
    }

    return this.integrationsRepository.save(connection);
  }
}
