# Supabase Setup Guide

This guide will help you migrate from Render to Supabase for database hosting.

## Step 1: Create Supabase Projects

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create two projects:
   - **Staging**: `ultiverse-league-staging`
   - **Production**: `ultiverse-league-production`

## Step 2: Get Connection Strings

For each project:

1. Go to **Project Settings** → **Database**
2. Scroll to **Connection string** section
3. Select **Connection pooling** (recommended for better performance)
4. Copy the connection string - it will look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
   ```
5. Replace `[password]` with your actual database password

## Step 3: Configure Environment Files

### For Staging:

1. Copy `.env.staging` to `.env` (for local development with staging DB):
   ```bash
   cp apps/api/.env.staging apps/api/.env
   ```

2. Update the `DATABASE_URL` in `apps/api/.env`:
   ```
   DATABASE_URL=postgresql://postgres.[staging-ref]:[password]@[region].pooler.supabase.com:6543/postgres
   ```

3. Update other required credentials:
   ```
   JWT_SECRET=your-jwt-secret-here
   ENCRYPTION_KEY=your-encryption-key-here
   ```

### For Production:

Update `apps/api/.env.production` with your production Supabase connection string.

## Step 4: Run Migrations

### Local Testing with Staging DB:

```bash
# Start the API server (migrations will run automatically)
pnpm dev:api
```

The migrations will automatically run and create all tables with proper camelCase column names.

### Production Deployment:

When deploying to production, ensure:
1. `NODE_ENV=production` is set
2. `DATABASE_URL` points to production Supabase
3. `migrationsRun` in database config will handle migrations automatically (or run manually if preferred)

## Step 5: Verify Database Schema

In Supabase dashboard:

1. Go to **Table Editor**
2. Verify all tables are created:
   - `accounts`
   - `integration_connections`
   - `organizations`
   - `teams`
   - `players`
   - `memberships`
   - `leagues`
   - `external_league_sources`
   - `external_player_sources`

3. Verify columns use camelCase (e.g., `organizationId`, `seasonStart`, `leagueId`)

## Troubleshooting

### If migrations fail:

1. Check Supabase logs in dashboard
2. Verify connection string is correct
3. Ensure database user has proper permissions
4. Check that extensions are enabled (uuid-ossp, citext)

### Reset database (staging only):

```bash
# Connect to Supabase via SQL Editor in dashboard
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then restart the API to re-run migrations.

## Migration Files

All migrations are located in `apps/api/src/database/migrations/` and use:
- **camelCase** column names with quoted identifiers (e.g., `"organizationId"`)
- **IF NOT EXISTS** clauses for idempotent execution
- **Proper ordering** via timestamps

## Benefits of Supabase

- Better database management UI
- Built-in SQL editor
- Real-time monitoring
- Automatic backups (paid tiers)
- Connection pooling built-in
- Free tier for staging environments
