# Database Setup Guide

This guide covers database setup for all environments: local development, production (Render), and CI/CD (GitHub Actions).

## Table of Contents

1. [Local Development](#local-development)
2. [Production (Render)](#production-render)
3. [CI/CD (GitHub Actions)](#cicd-github-actions)
4. [Database Migrations](#database-migrations)
5. [Testing](#testing)

---

## Local Development

### Prerequisites

- PostgreSQL 13+ installed and running
- Node.js 20+
- pnpm 9.12.3+

### Quick Setup

1. **Start PostgreSQL**
   ```bash
   # macOS (Postgres.app)
   # Open Postgres.app from Applications

   # macOS (Homebrew)
   brew services start postgresql

   # Linux
   sudo systemctl start postgresql
   ```

2. **Run the setup script**
   ```bash
   pnpm db:setup
   ```

   This script will:
   - Create the `ultiverse` database if it doesn't exist
   - Run all pending migrations
   - Set up the schema

3. **Create environment files for each app**

   **API:**
   ```bash
   cd apps/api
   cp .env.example .env.local
   ```

   Edit `apps/api/.env.local` if you have custom PostgreSQL credentials:
   ```bash
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres      # Change if different
   DATABASE_PASSWORD=postgres      # Change if different
   DATABASE_NAME=ultiverse
   NODE_ENV=development
   PORT=3000
   ```

   **Web:**
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

   The web app just needs the API URL:
   ```bash
   VITE_API_BASE_URL=http://localhost:3000
   ```

4. **Start the API server**
   ```bash
   pnpm dev:api
   ```

### Manual Setup

If you prefer to set up manually:

```bash
# 1. Create the database
psql -U postgres -c "CREATE DATABASE ultiverse;"

# 2. Run migrations
pnpm db:migrate

# 3. (Optional) Seed test data
pnpm -C apps/api seed:dev
```

---

## Production (Render)

### Database Configuration

Production uses a managed PostgreSQL database on Render.

**Connection Details:**
- Host: `dpg-d3nconeuk2gs7387dvs0-a.render.com`
- Port: `5432`
- Database: `ultiverse_xhay`
- Username: `ultiverse_xhay_user`
- Password: (stored securely in Render environment variables)

### Setting Environment Variables in Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your web service
3. Navigate to **Environment** tab
4. Add environment variables for:
   - Database connection (DATABASE_HOST, DATABASE_PORT, etc.)
   - Security keys (JWT_SECRET, ENCRYPTION_KEY)
   - NODE_ENV=production
   - PORT=3000

### Running Migrations in Production

Migrations should be run automatically on deployment, but you can also run them manually:

1. Connect to your Render shell
2. Run:
   ```bash
   pnpm db:migrate
   ```

Or use Render's "Run Command" feature to execute:
```bash
pnpm --filter ./apps/api migration:run
```

---

## CI/CD (GitHub Actions)

### Overview

E2E tests run in GitHub Actions with a PostgreSQL service container.

### Configuration

The E2E workflow ([.github/workflows/e2e.yml](.github/workflows/e2e.yml)) automatically:

1. Starts a PostgreSQL 15 container
2. Creates a test database (`ultiverse_test`)
3. Runs migrations before tests
4. Executes E2E tests

### Environment Variables

The following are automatically configured in the workflow:

```yaml
DATABASE_HOST: localhost
DATABASE_PORT: 5432
DATABASE_USERNAME: postgres
DATABASE_PASSWORD: postgres
DATABASE_NAME: ultiverse_test
NODE_ENV: test
```

No secrets needed - the test database is ephemeral and destroyed after each run.

---

## Database Migrations

### Creating a New Migration

```bash
# Generate a migration from entity changes
pnpm -C apps/api migration:generate src/database/migrations/YourMigrationName

# Or create an empty migration
pnpm -C apps/api migration:create src/database/migrations/YourMigrationName
```

### Running Migrations

```bash
# Run all pending migrations
pnpm db:migrate

# Or use the full command
pnpm -C apps/api migration:run
```

### Reverting Migrations

```bash
# Revert the last migration
pnpm db:migrate:revert

# Or use the full command
pnpm -C apps/api migration:revert
```

### Migration Best Practices

1. **Always test migrations locally** before pushing
2. **Run migrations in a transaction** (default in TypeORM)
3. **Make migrations reversible** when possible
4. **Test rollback** before deploying to production
5. **Never edit committed migrations** - create a new one instead

---

## Testing

### Running the Deduplication Test

To verify team deduplication works with multiple users:

```bash
# Ensure database is set up
pnpm db:setup

# Run the test
cd apps/api
npx tsx src/database/seeds/test-team-deduplication.ts
```

This test will:
- Create two test users (Alice and Bob)
- Import the same UC team for both users
- Verify only one canonical team is created
- Verify both users are linked to the same team
- Test idempotency
- Clean up test data

### Running E2E Tests

```bash
# Run all E2E tests
pnpm test:e2e

# Or just API E2E tests
pnpm -C apps/api test:e2e
```

---

## Troubleshooting

### "database does not exist"

```bash
# Recreate the database
psql -U postgres -c "DROP DATABASE IF EXISTS ultiverse;"
psql -U postgres -c "CREATE DATABASE ultiverse;"
pnpm db:migrate
```

### "column type for ... is not defined"

This usually means TypeORM can't infer types. Ensure:
1. `reflect-metadata` is imported at the top of your main file
2. All `@Column()` decorators have explicit `type` parameters
3. `emitDecoratorMetadata: true` is in tsconfig.json

### "connection refused"

Check that PostgreSQL is running:
```bash
# Check if postgres is running
pg_isready

# Check the service status
# macOS (Homebrew)
brew services list

# Linux
sudo systemctl status postgresql
```

### Migration Conflicts

If migrations are out of sync:

```bash
# Option 1: Revert all migrations and re-run
pnpm db:migrate:revert  # Run multiple times if needed
pnpm db:migrate

# Option 2: Fresh database (CAUTION: destroys data)
psql -U postgres -c "DROP DATABASE IF EXISTS ultiverse;"
psql -U postgres -c "CREATE DATABASE ultiverse;"
pnpm db:migrate
```

---

## Additional Resources

- [TypeORM Migrations Documentation](https://typeorm.io/migrations)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Render PostgreSQL Guide](https://render.com/docs/databases)
- [GitHub Actions Services](https://docs.github.com/en/actions/using-containerized-services/about-service-containers)
