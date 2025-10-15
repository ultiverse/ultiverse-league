import { DataSource } from 'typeorm';
import {
  Account,
  Profile,
  IntegrationConnection,
  Team,
  Player,
  UserTeamMembership,
  ExternalTeamSource,
} from './entities';

// Auto-determine schema from NODE_ENV: staging uses 'staging' schema, others use 'public'
const nodeEnv = process.env.NODE_ENV || 'development';
const schema = nodeEnv === 'staging' ? 'staging' : 'public';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'ultiverse',
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
  synchronize: false, // Always false for migrations
  logging: nodeEnv === 'development',
  ssl:
    nodeEnv === 'production' || nodeEnv === 'staging'
      ? { rejectUnauthorized: false }
      : false,
});
