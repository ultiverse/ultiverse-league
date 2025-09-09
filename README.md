# Ultiverse League (NestJS)

An experimental **Ultimate Frisbee league management app** built with [NestJS](https://nestjs.com/).  
The goal is to support **organizations, leagues (seasons), teams (incl. pods), players, games, fields, and users**, with pluggable integrations to external providers like [Ultimate Central](https://playwith.us/).

---

## Vision

- **Short-term (Pod MVP)**
  - Pair pods
  - Generate balanced schedules
  - Export CSV / ICS
  - Read from Ultimate Central (UC)
  - UC game preview (no push yet)

- **Long-term**
  - Full league operations
  - Multi-org support
  - Modular provider integrations (UC, etc.)
  - Database persistence (SQLite → Postgres)

---

## Tech Stack

- [NestJS](https://nestjs.com/) (TypeScript)
- Modular architecture (per domain: Leagues, Teams, Players, Games, Scheduling, Exports, Integrations)
- Validation: [`class-validator`](https://github.com/typestack/class-validator), [`class-transformer`](https://github.com/typestack/class-transformer)
- Config: [`@nestjs/config`](https://docs.nestjs.com/techniques/configuration) + [`zod`](https://zod.dev/)
- Exports: [ics](https://www.npmjs.com/package/ics) for calendar files
- Persistence:
  - Phase 1–MVP: in-memory repositories
  - Phase 2: JSON file adapter
  - Future: Prisma + SQLite

---

## Getting Started

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) (preferred package manager)

### Install

```bash
pnpm install
```
