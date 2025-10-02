import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Account, Profile, IntegrationConnection } from './entities';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST', 'localhost'),
  port: parseInt(configService.get('DATABASE_PORT', '5432'), 10),
  username: configService.get('DATABASE_USERNAME', 'postgres'),
  password: configService.get('DATABASE_PASSWORD', 'postgres'),
  database: configService.get('DATABASE_NAME', 'ultiverse'),
  entities: [Account, Profile, IntegrationConnection],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: configService.get('NODE_ENV') === 'development', // Only for development
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});