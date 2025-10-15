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

  return {
    type: 'postgres',
    host: configService.get('DATABASE_HOST', 'localhost'),
    port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
    username: configService.get('DATABASE_USERNAME', 'postgres'),
    password: configService.get('DATABASE_PASSWORD', 'postgres'),
    database: configService.get('DATABASE_NAME', 'ultiverse'),
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
};
