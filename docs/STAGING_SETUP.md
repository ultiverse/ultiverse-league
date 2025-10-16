# Staging Environment Setup

## Overview

The project has two environments configured in Render:

- **Production** (`ultiverse-league-prod`) - Deploys from `main` branch
- **Staging** (`ultiverse-league-staging`) - Deploys from `staging` branch

**Both environments share the same database** but use different PostgreSQL schemas:
- Production uses `public` schema
- Staging uses `staging` schema

This provides complete isolation while using a single Render database (free tier).

## How It Works

PostgreSQL **schemas** are like namespaces within a database. Each schema contains its own set of tables:

```
ultiverse_xhay database
├── public schema (production)
│   ├── accounts
│   ├── teams
│   ├── profiles
│   └── ...
└── staging schema (staging)
    ├── accounts
    ├── teams
    ├── profiles
    └── ...
```

The schemas are completely isolated - production cannot see staging tables and vice versa.

## Setup Steps

### 1. Create Staging Branch

```bash
# Create staging branch from main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging
```

### 2. Database Configuration

**No new database needed!** Both environments use your existing Render PostgreSQL database.

The schema is **automatically determined** from `NODE_ENV`:
- `NODE_ENV=production` → uses `public` schema
- `NODE_ENV=staging` → uses `staging` schema
- `NODE_ENV=development` → uses `public` schema

### 3. Deploy Staging Service

The staging service is already configured in `render.yaml`. When you push this file:

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Render will detect the new service definition
3. The `ultiverse-league-staging` service will appear

### 4. Configure Staging Environment Variables

In Render dashboard for `ultiverse-league-staging`:

**Database (same connection as production):**
- `DATABASE_HOST` - Copy from production service
- `DATABASE_PORT` - Copy from production service
- `DATABASE_NAME` - Copy from production service
- `DATABASE_USERNAME` - Copy from production service
- `DATABASE_PASSWORD` - Copy from production service

**Generate New Secrets (must be different from production):**
- `JWT_SECRET` - Generate a unique random string
- `ENCRYPTION_KEY` - Generate a unique random string

**Already Set in render.yaml:**
- `NODE_ENV` = `staging` (auto-determines schema)
- `PORT` = `3000`
- `NODE_VERSION` = `20`

### 5. Deploy Staging

```bash
# Push to staging branch
git checkout staging
git push origin staging
```

Render will automatically:
1. Build the application
2. Create `staging` schema if it doesn't exist
3. Run migrations in the `staging` schema
4. Seed the database with test data
5. Start the server

## Workflow

### Development Flow

```
feature branch
     │
     ├──> staging branch (PR & merge)
     │         │
     │         │ Test in staging
     │         │
     │         ├──> main branch (PR & merge)
     │                    │
     │                    │ Deploy to production
     │                    ▼
     │              Production
     ▼
Staging
```

### Typical Workflow

1. **Develop**: Create feature branch from `main`
   ```bash
   git checkout main
   git pull
   git checkout -b feature/my-feature
   ```

2. **Test Locally**: Develop and test locally

3. **Deploy to Staging**: Merge to `staging` branch
   ```bash
   git checkout staging
   git merge feature/my-feature
   git push origin staging
   ```

4. **Test in Staging**: Verify everything works

5. **Deploy to Production**: Merge to `main`
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

## Environment Differences

| | Staging | Production |
|---|---|---|
| **Branch** | `staging` | `main` |
| **Database** | Same connection | Same connection |
| **Schema** | `staging` | `public` |
| **Tables** | Isolated | Isolated |
| **NODE_ENV** | `staging` | `production` |
| **Purpose** | Testing, QA | Real users |
| **Deploy frequency** | Often | Carefully |
| **Previews** | Enabled | Disabled |

## Benefits

✅ **Cost-effective** - Uses single free database
✅ **Complete isolation** - Tables cannot interfere
✅ **Same infrastructure** - Tests real Render environment
✅ **Easy setup** - Just copy database credentials
✅ **Independent data** - Safe to reset staging anytime

## Migrations & Seeding

**Migrations** run automatically on both environments:
- Staging migrations go to `staging` schema
- Production migrations go to `public` schema
- Test migrations in staging before deploying to production

**Seeding** (staging only):
After migrations, staging is automatically seeded with test data:
- Test accounts: `admin@staging.test`, `user@staging.test`
- Sample team: "Staging Test Team"
- Integration connection stubs

This gives you a working environment immediately after deploy!

## Cleanup

If you need to reset staging:

```sql
-- Connect to database via Render shell
psql $DATABASE_URL

-- Drop staging schema and recreate
DROP SCHEMA IF EXISTS staging CASCADE;
CREATE SCHEMA staging;
```

Then redeploy staging to run migrations fresh.

## Verification

After deploying staging, verify schema isolation:

```sql
-- Connect to database
psql $DATABASE_URL

-- List all schemas
\dn

-- You should see:
-- public (production tables)
-- staging (staging tables)

-- List tables in staging schema
\dt staging.*

-- List tables in public schema
\dt public.*
```

## URLs

Once deployed:
- **Production**: `https://ultiverse-league-prod.onrender.com`
- **Staging**: `https://ultiverse-league-staging.onrender.com`

(Actual URLs shown in Render dashboard)

## Best Practices

1. **Always test in staging first** before deploying to production
2. **Use staging for breaking changes** - Verify they work end-to-end
3. **Reset staging periodically** - Keep it fresh and clean
4. **Use separate JWT/encryption keys** - Never share secrets
5. **Monitor both environments** - Check health endpoints regularly

## Troubleshooting

### Staging deploy failed
- Check build logs in Render dashboard
- Verify all environment variables are set
- Ensure staging branch is up to date

### Database connection errors
- Verify DATABASE_* env vars match production
- Check DATABASE_SCHEMA is set to `staging`
- Verify SSL is enabled (automatically handled)

### Tables not isolated
- Verify DATABASE_SCHEMA is different for each environment
- Check that migrations ran successfully
- Look at Render logs for the migration step

### Staging and production out of sync
```bash
# Sync staging with production
git checkout staging
git merge main
git push origin staging
```

## Migration Testing Checklist

Before deploying migrations to production:

1. ✅ Create migration locally
2. ✅ Test migration locally
3. ✅ Deploy to staging
4. ✅ Verify staging schema with `\dt staging.*`
5. ✅ Test application functionality in staging
6. ✅ Verify rollback works (revert migration)
7. ✅ Re-apply migration
8. ✅ Deploy to production (if all tests pass)
