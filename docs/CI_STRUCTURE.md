# CI/CD Structure

## Overview

The CI system uses a **single orchestrator workflow** that coordinates all checks. This provides a clear, unified status and prevents duplicate runs.

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         ci.yml                              │
│                    (Main Orchestrator)                      │
│                                                             │
│  Triggers: PR, Push to main                                │
│  Status Check: ✓ "CI"                                       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ calls reusable workflows
                            ▼
    ┌───────────────────────────────────────────────┐
    │                                               │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
    │  │  Build   │  │   Lint   │  │   Test   │   │
    │  └──────────┘  └──────────┘  └──────────┘   │
    │                                               │
    │              ┌──────────┐                     │
    │              │   E2E    │                     │
    │              │ +        │                     │
    │              │ Database │                     │
    │              └──────────┘                     │
    │                                               │
    └───────────────────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   CI Summary    │
                   └─────────────────┘
```

## Execution Flow

**Parallel Jobs:**
- Build, Lint, Test run concurrently
- Fast failure if any check fails

**Sequential Jobs:**
- E2E runs after Build succeeds
- Ensures artifacts are ready for integration tests

**Summary:**
- Final job reports which checks passed/failed

## GitHub Actions Database (E2E Tests)

### Service Container Setup

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ultiverse_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

### How It Works

1. **Container Start**: GitHub spins up a PostgreSQL 15 Docker container
2. **Health Checks**: Waits until database is ready (using `pg_isready`)
3. **Network**: Available at `localhost:5432` within the job
4. **Migrations**: Job runs `pnpm db:migrate` to set up schema
5. **Tests Run**: E2E tests execute against the database
6. **Cleanup**: Container automatically destroyed after job completes

### Key Features

✅ **Zero Configuration** - No external database needed
✅ **Isolated** - Fresh database for each run
✅ **Fast** - Local to the runner, no network latency
✅ **Free** - Part of GitHub Actions, no additional cost
✅ **Reliable** - Same PostgreSQL version as production

## Benefits

✅ **Single status check** - One "CI" check instead of multiple
✅ **No duplicates** - Each workflow runs once per trigger
✅ **Clear failures** - Summary shows exactly which step failed
✅ **Parallel execution** - Faster feedback where possible
✅ **Reusable workflows** - Easy to run individual checks manually

## Workflow Files

### Main Workflow
- **ci.yml** - Entry point, orchestrates everything

### Reusable Workflows
- **build.yml** - Builds API and Web
- **lint.yml** - Lints API and Web
- **test.yml** - Runs unit tests for API and Web
- **e2e.yml** - Runs E2E tests with PostgreSQL

## Viewing Results

### On Pull Requests

You'll see a single check:
```
✓ CI — All checks passed
  or
✗ CI — Some checks failed
```

Click to expand and see:
- Build Check
- Lint Check
- Test Suite
- E2E Tests

### On Failed Builds

The summary job shows exactly what failed:
```
=== CI Results Summary ===
Build: success
Lint: failure        ← Clear indicator
Test: success
E2E: success
==========================
```

## Best Practices

1. **Check the CI status** - Single source of truth for PR health
2. **Click into failed jobs** - See exactly which step failed
3. **Run individual workflows manually** - Use Actions tab for debugging
4. **Review E2E database logs** - Check migration steps if tests fail

## Troubleshooting

**CI check stuck?**
- Check if jobs are still running
- Review individual job logs

**E2E database errors?**
- Verify PostgreSQL service started successfully
- Check migration step output
- Ensure DATABASE_* env vars are set correctly

**Need to debug a specific check?**
- Run workflows manually from Actions tab
- Add `workflow_dispatch:` trigger for easier testing
