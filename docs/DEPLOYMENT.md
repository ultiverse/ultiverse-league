# Deployment Guide

## Overview

The project uses **Render** for hosting with automatic deployments from GitHub.

```
GitHub Branches          GitHub Actions          Render
─────────────────        ──────────────          ──────

feature branch
     │
     ├─► PR to staging
     │        │
     │        ├─► CI runs ✓
     │        │   - Build
     │        │   - Lint
     │        │   - Test
     │        │   - E2E
     │        │
     ▼        ▼
   staging ─────────► Auto-deploy ────► Staging Env
     │                                   (staging schema)
     │
     ├─► PR to main
     │        │
     │        ├─► CI runs ✓
     │        │
     ▼        ▼
    main ─────────► Auto-deploy ────► Production Env
                                       (public schema)
```

## GitHub Actions CI

### What It Does

The CI workflow runs on:
- All pull requests
- Pushes to `main` branch
- Pushes to `staging` branch

### Checks Performed

1. **Build** - Ensures all packages build successfully
2. **Lint** - Code style and quality checks
3. **Test** - Unit tests for API and Web
4. **E2E** - Integration tests with PostgreSQL

**Result:** Single "CI" status check (pass/fail)

### CI Before Render

```
Developer pushes to staging
        │
        ▼
   GitHub Actions CI
   ├─ Build ✓
   ├─ Lint ✓
   ├─ Test ✓
   └─ E2E ✓
        │
        ▼
   All checks pass
        │
        ▼
   Render detects push
        │
        ▼
   Render builds & deploys
```

If CI fails, Render will still try to deploy (no automatic blocking). To prevent this, set up **branch protection**.

## Branch Protection (Recommended)

### Why?

- Prevents broken code from deploying to Render
- Requires CI to pass before merging
- Enforces code review on important branches

### Setup

1. Go to your GitHub repo
2. Navigate to **Settings** → **Branches**
3. Add protection rules for both `main` and `staging`:

#### Protection for `main` branch:
```
✓ Require a pull request before merging
  ✓ Require approvals (1)
✓ Require status checks to pass before merging
  ✓ Require branches to be up to date before merging
  Status checks:
    ✓ CI (the main status check)
✓ Do not allow bypassing the above settings
```

#### Protection for `staging` branch:
```
✓ Require status checks to pass before merging
  Status checks:
    ✓ CI (the main status check)
□ Do not require pull request (optional - allow direct push to staging)
```

### Result

With branch protection:
- Can't merge to `main` or `staging` if CI fails
- Broken code never reaches Render
- Production stays stable

## Render Deployment

### Automatic Deployment

Render automatically deploys when:
- Code is pushed to `main` → deploys to production
- Code is pushed to `staging` → deploys to staging

### Build Process

Render runs (defined in `render.yaml`):
```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build:types
pnpm build:web
pnpm build:api
pnpm -C apps/api migration:run  # ← Creates/updates tables
```

If any step fails, deployment is cancelled.

### Deployment Time

- **First deploy**: ~3-5 minutes (includes migrations)
- **Subsequent deploys**: ~1-3 minutes
- **If only frontend changes**: ~1-2 minutes

## Monitoring Deployments

### Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Select your service
3. View:
   - **Logs** - Build and runtime logs
   - **Events** - Deploy history and status
   - **Metrics** - Resource usage

### Deploy Status

Check deploy status:
- **In Progress** - Currently deploying (blue)
- **Live** - Successfully deployed (green)
- **Failed** - Build or deploy failed (red)

### Health Checks

Both environments have health endpoints:
- Production: `https://ultiverse-league-prod.onrender.com/health`
- Staging: `https://ultiverse-league-staging.onrender.com/health`

Returns:
```json
{
  "status": "ok",
  "timestamp": "2025-10-15T12:34:56.789Z"
}
```

## Rollback

If a deployment breaks production:

### Option 1: Revert the Git Commit
```bash
git checkout main
git revert <bad-commit-hash>
git push origin main
```

Render will auto-deploy the revert.

### Option 2: Rollback in Render Dashboard
1. Go to service in Render
2. Click **Events** tab
3. Find previous successful deploy
4. Click **Rollback to this deploy**

### Option 3: Redeploy Previous Version
1. In Render dashboard
2. Click **Manual Deploy**
3. Select previous commit hash

## Migration Failures

If migrations fail during deployment:

### Symptoms
- Render shows "Build Failed" or "Deploy Failed"
- Logs show migration errors
- Application won't start

### Solution

1. **Check logs** in Render dashboard
2. **Fix migration** locally
3. **Test in staging first**:
   ```bash
   git checkout staging
   git cherry-pick <fix-commit>
   git push origin staging
   ```
4. **Verify staging works**
5. **Deploy to main**:
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```

### Prevention

- Always test migrations in staging first
- Never skip staging for database changes
- Use the migration testing checklist

## Environment Variables

### Where to Set

Environment variables are set in **Render Dashboard**:
1. Select service
2. Go to **Environment** tab
3. Add/edit variables
4. Click **Save Changes**

Changes require a **redeploy** to take effect.

### Required Variables

**Both Environments Need:**
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `JWT_SECRET` (different for each)
- `ENCRYPTION_KEY` (different for each)

**Automatically Set:**
- `NODE_ENV` (from render.yaml)
- `PORT` (from render.yaml)
- `NODE_VERSION` (from render.yaml)

## Best Practices

### Development Workflow

1. **Create feature branch** from `main`
2. **Develop and test locally**
3. **Create PR to staging**
4. **Wait for CI to pass** ✓
5. **Merge to staging**
6. **Test in staging environment**
7. **Create PR to main**
8. **Wait for CI to pass** ✓
9. **Get code review**
10. **Merge to main** → Auto-deploys to production

### Database Changes

1. ✅ Create migration locally
2. ✅ Test migration locally
3. ✅ Deploy to staging (test migrations)
4. ✅ Verify staging works
5. ✅ Deploy to production

**Never:**
- ❌ Deploy database changes directly to production
- ❌ Skip staging for schema changes
- ❌ Use `synchronize: true` in production

### Deployment Checklist

Before merging to main:
- ✅ All CI checks pass
- ✅ Tested in staging
- ✅ Database migrations tested (if applicable)
- ✅ No breaking changes without plan
- ✅ Environment variables updated (if needed)

## Troubleshooting

### Deployment Failed

**Check Render logs:**
```
Render Dashboard → Service → Logs
```

Common issues:
- Build errors (TypeScript, lint, tests)
- Migration failures
- Missing environment variables
- Dependency installation issues

### Application Not Starting

**Check Render logs for:**
- Database connection errors
- Missing environment variables
- Port binding issues
- Startup crashes

**Verify:**
- Health endpoint returns 200
- Database credentials are correct
- NODE_ENV is set correctly

### Slow Deployments

**Causes:**
- Large dependencies (node_modules)
- Complex builds
- First-time migrations

**Solutions:**
- Use pnpm (already configured)
- Keep dependencies minimal
- Test migrations beforehand

### Environment Variables Not Applied

**Remember:**
- Changes to env vars require **redeploy**
- Click "Save Changes" then "Manual Deploy"
- Or push a new commit to trigger auto-deploy

## Deploy Notifications (Optional)

### Slack/Discord Webhooks

You can set up Render to send notifications:
1. Render Dashboard → Service → Settings
2. Scroll to **Deploy Hooks**
3. Add webhook URL for Slack/Discord
4. Receive notifications on:
   - Deploy started
   - Deploy succeeded
   - Deploy failed

## Summary

**GitHub CI:**
- ✅ Runs on PRs and pushes to `main`/`staging`
- ✅ Catches issues before Render
- ✅ Single status check

**Branch Protection:**
- ⚠️ Recommended to set up
- ⚠️ Prevents broken merges
- ⚠️ Requires CI to pass

**Render:**
- ✅ Auto-deploys on push
- ✅ Runs migrations automatically
- ✅ Health checks enabled
- ✅ Easy rollback

**Workflow:**
```
Feature → Staging (CI ✓) → Test → Main (CI ✓) → Production
```
