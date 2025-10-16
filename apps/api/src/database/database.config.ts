import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import {
  Account,
  Profile,
  IntegrationConnection,
  Team,
  Player,
  UserTeamMembership,
  ExternalTeamSource,
} from './entities';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  // Auto-determine schema from NODE_ENV: staging uses 'staging' schema, others use 'public'
  const schema = nodeEnv === 'staging' ? 'staging' : 'public';

  // Use DATABASE_URL if available, otherwise fall back to individual variables for local dev
  const databaseUrl = configService.get<string>('DATABASE_URL');

  const baseConfig = {
    type: 'postgres' as const,
    schema,
    entities: [
      Account,
      Profile,
      IntegrationConnection,
      Team,
      Player,
      UserTeamMembership,
      ExternalTeamSource,
    ],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: nodeEnv === 'development', // Only for development
    logging: nodeEnv === 'development',
    ssl:
      nodeEnv === 'production' || nodeEnv === 'staging'
        ? { rejectUnauthorized: false }
        : false,
  };

  if (databaseUrl) {
    return {
      ...baseConfig,
      url: databaseUrl,
    };
  }

  return {
    ...baseConfig,
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: parseInt(configService.get<string>('DATABASE_PORT', '5432'), 10),
    username: configService.get<string>('DATABASE_USERNAME', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
    database: configService.get<string>('DATABASE_NAME', 'ultiverse'),
  };
};
