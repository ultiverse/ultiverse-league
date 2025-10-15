# Quick Start Guide

Get up and running with Ultiverse League in minutes!

## Prerequisites

- **Node.js 20+**
- **pnpm 9.12.3+**
- **PostgreSQL 13+**

## Setup Steps

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Database

```bash
# Start PostgreSQL (if not running)
# macOS (Postgres.app): Open Postgres.app
# macOS (Homebrew): brew services start postgresql
# Linux: sudo systemctl start postgresql

# Run the setup script
pnpm db:setup
```

### 3. Configure Environment

```bash
# API environment
cd apps/api
cp .env.example .env.local
cd ../..

# Web environment
cd apps/web
cp .env.example .env.local
cd ../..

# Default values work for local dev
```

### 4. Build Shared Types

```bash
pnpm build:types
```

### 5. Start Development Servers

```bash
# Terminal 1 - Start API
pnpm dev:api

# Terminal 2 - Start Web (in a new terminal)
pnpm dev:web
```

## Access the Application

- **Web App**: http://localhost:5173
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api (if Swagger is configured)

## Common Commands

### Development
```bash
pnpm dev:api          # Start API server in watch mode
pnpm dev:web          # Start web app with hot reload
```

### Building
```bash
pnpm build:types      # Build shared TypeScript types
pnpm build:api        # Build API for production
pnpm build:web        # Build web app for production
```

### Testing
```bash
pnpm test             # Run all tests
pnpm test:api         # Run API unit tests
pnpm test:web         # Run web unit tests
pnpm test:e2e         # Run E2E tests
```

### Database
```bash
pnpm db:setup         # Set up local database
pnpm db:migrate       # Run pending migrations
pnpm db:migrate:revert # Revert last migration
```

### Linting
```bash
pnpm lint             # Lint all projects
pnpm lint:api         # Lint API only
pnpm lint:web         # Lint web only
```

## Project Structure

```
ultiverse-league/
├── apps/
│   ├── api/          # NestJS API server
│   └── web/          # React web application
├── packages/
│   └── shared-types/ # Shared TypeScript types
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

## Next Steps

- Read the [Database Setup Guide](./DATABASE_SETUP.md) for detailed database configuration
- Check out the [API documentation](../apps/api/README.md) (if available)
- Review the [Web app documentation](../apps/web/README.md) (if available)

## Troubleshooting

### Database connection issues
```bash
# Check if PostgreSQL is running
pg_isready

# Verify database exists
psql -U postgres -l | grep ultiverse
```

### Port already in use
```bash
# API (port 3000)
lsof -ti:3000 | xargs kill -9

# Web (port 5173)
lsof -ti:5173 | xargs kill -9
```

### Clean install
```bash
# Remove all dependencies and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

For more help, see the detailed [Database Setup Guide](./DATABASE_SETUP.md) or open an issue on GitHub.
