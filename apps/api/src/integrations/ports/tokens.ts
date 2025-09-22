import { InjectionToken } from '@nestjs/common';

export const LEAGUE_PROVIDER = Symbol('LEAGUE_PROVIDER') as InjectionToken;
export const REGISTRATION_PROVIDER = Symbol(
  'REGISTRATION_PROVIDER',
) as InjectionToken;
export const TEAMS_PROVIDER = Symbol('TEAMS_PROVIDER') as InjectionToken;
export const GAMES_PROVIDER = Symbol('GAMES_PROVIDER') as InjectionToken;
export const USER_PROVIDER = Symbol('USER_PROVIDER') as InjectionToken;
