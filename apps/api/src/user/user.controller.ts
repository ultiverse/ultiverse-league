import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { UserService, MeLeaguesResponse } from './user.service';
import { UserProfile } from '../integrations/ports/user.port';
import { Account } from '../database/entities';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getCurrentUser(): Promise<UserProfile | null> {
    return this.userService.getCurrentUser();
  }

  @Post('login')
  async login(@Body('email') email: string): Promise<Account> {
    if (!email || typeof email !== 'string') {
      throw new Error('Email is required');
    }

    // Find or create account
    let account = await this.userService['accountsService'].findByEmail(email);

    if (!account) {
      // Create new account
      account = await this.userService['accountsService'].createAccountFromIntegration(
        email,
        'email',
        email, // Use email as external user ID for email-based accounts
      );
    } else {
      // Update last login
      await this.userService['accountsService'].updateLastLogin(account.id, 'email');
    }

    return account;
  }

  @Get('me/leagues')
  async getMyLeagues(
    @Query('fresh') fresh?: 'if-stale' | 'force',
  ): Promise<MeLeaguesResponse> {
    // TODO: Get user ID from authentication
    // For now, get it from the hardcoded email
    const email = 'greg@gregpike.ca';
    const account = await this.userService['accountsService'].findByEmail(email);

    if (!account) {
      return { leagues: [], connections: [] };
    }

    return this.userService.getMyLeagues(account.id, { fresh });
  }

  @Get('me/org-leagues')
  async getOrgLeagues(): Promise<MeLeaguesResponse> {
    // TODO: Get user ID from authentication
    // For now, get it from the hardcoded email
    const email = 'greg@gregpike.ca';
    const account = await this.userService['accountsService'].findByEmail(email);

    if (!account) {
      return { leagues: [], connections: [] };
    }

    return this.userService.getOrgLeagues(account.id);
  }
}
