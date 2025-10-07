import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, Profile, IntegrationConnection } from '../database/entities';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(IntegrationConnection)
    private integrationsRepository: Repository<IntegrationConnection>,
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
    // Create account
    const account = this.accountsRepository.create({
      email,
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

    // Create integration connection
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

    return savedAccount;
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
