# Ultiverse League

A **Ultimate Frisbee league management app** with a React frontend and NestJS API backend.
The goal is to support **organizations, leagues (seasons), teams (incl. pods), players, games, fields, and users**, with pluggable integrations to external providers like [Ultimate Central](https://playwith.us/).

---

## Vision

- **Current Features**
  - Team and pod management
  - Generate balanced schedules from selected teams
  - Interactive web interface with team colors and jersey icons
  - Ultimate Central integration for team data
  - Responsive Material-UI design

- **Long-term**
  - Full league operations
  - Multi-org support
  - Modular provider integrations (UC, etc.)
  - Database persistence (SQLite → Postgres)
  - Game results tracking and standings

---

## Tech Stack

### Frontend (Web App)

- [React](https://react.dev/) with TypeScript
- [Material-UI (MUI) v5](https://mui.com/) for components and theming
- [React Query](https://tanstack.com/query) for API state management
- [React Router](https://reactrouter.com/) for client-side routing
- [Vite](https://vitejs.dev/) for build tooling

### Backend (API)

- [NestJS](https://nestjs.com/) (TypeScript)
- Modular architecture (per domain: Leagues, Teams, Players, Games, Scheduling, Exports, Integrations)
- Validation: [`class-validator`](https://github.com/typestack/class-validator), [`class-transformer`](https://github.com/typestack/class-transformer)
- Config: [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration) + [`zod`](https://zod.dev/)
- Exports: [ics](https://www.npmjs.com/package/ics) for calendar files
- Persistence:
  - MVP: in-memory repositories
  - Future: Prisma + Postgres

---

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (preferred package manager)

### Install

```bash
pnpm install
```

### Development

Run both the API and web app in development mode:

```bash
# Start the API (NestJS) on port 3000
pnpm dev:api

# Start the web app (React + Vite) on port 5173
pnpm dev:web

# Or run both concurrently
pnpm dev
```

The web app will be available at http://localhost:5173 and will proxy API requests to the NestJS server at http://localhost:3000.

### Building for Production

```bash
# Build shared types first
pnpm build:types

# Build the web app
pnpm build:web

# Build the API
pnpm build:api

# Or build everything
pnpm build
```

### Deployment

The app is configured to deploy to [Render](https://render.com) as a single service that serves both the API and the React app as static files.

The deployment configuration is in `render.yaml` and will:

1. Build both the API and web app
2. Serve the React app as static files from the NestJS server
3. Handle API routes under `/api/v1/`
4. Provide SPA fallback routing for client-side navigation

Required environment variables:

- `UC_CLIENT_ID` - Ultimate Central client ID
- `UC_CLIENT_SECRET` - Ultimate Central client secret
- `UC_API_DOMAIN` - Ultimate Central API domain
