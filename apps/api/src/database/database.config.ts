import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  // Use 'public' schema for all environments (Supabase default)
  // Can override with DATABASE_SCHEMA env var if needed
  const schema = configService.get<string>('DATABASE_SCHEMA', 'public');

  // Use DATABASE_URL if available, otherwise fall back to individual variables for local dev
  const databaseUrl = configService.get<string>('DATABASE_URL');

  const baseConfig = {
    type: 'postgres' as const,
    schema,
    entities: [__dirname + '/**/*.entity{.js,.ts}'],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false, // Disabled - use migrations instead
    migrationsRun: nodeEnv !== 'production', // Auto-run migrations in dev/staging
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
