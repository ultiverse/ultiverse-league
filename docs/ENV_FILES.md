# Environment Files Structure

## Overview

Environment files are **app-specific** and located within each app's directory.

```
ultiverse-league/
├── apps/
│   ├── api/
│   │   ├── .env.example    ← Template (committed)
│   │   ├── .env.local      ← Your local config (gitignored)
│   │   └── .env            ← Optional fallback (gitignored)
│   └── web/
│       ├── .env.example    ← Template (committed)
│       ├── .env.local      ← Your local config (gitignored)
│       └── .env            ← Optional fallback (gitignored)
```

## Why App-Specific?

Different apps need different environment variables:

- **API** needs: `DATABASE_*`, `JWT_SECRET`, `ENCRYPTION_KEY`, `PORT`
- **Web** needs: `VITE_API_BASE_URL`

## Setup for Local Development

```bash
# API
cd apps/api
cp .env.example .env.local

# Web
cd apps/web
cp .env.example .env.local
```

## Load Order

### API (NestJS)
Configured in `apps/api/src/app.module.ts`:
```typescript
ConfigModule.forRoot({
  envFilePath: ['.env.local', '.env'],
})
```

Loads in order:
1. `.env.local` (highest priority - your local overrides)
2. `.env` (fallback)

### Web (Vite)
Vite automatically loads from `apps/web/`:
1. `.env.local` (highest priority)
2. `.env`

Variables must be prefixed with `VITE_` to be accessible in the browser.

## Production

Production uses **environment variables** set directly in the hosting platform (Render):
- No `.env` files needed
- Set variables in Render dashboard
- More secure than committed files

## Gitignore

All `.env*` files are gitignored except `.env.example`:
```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

`.env.example` files ARE committed as templates.

## Best Practices

✅ **DO:**
- Copy `.env.example` to `.env.local` for local dev
- Use `.env.local` for personal overrides
- Keep sensitive data in `.env.local` (never commit)
- Update `.env.example` when adding new required variables

❌ **DON'T:**
- Commit actual credentials
- Share `.env.local` or `.env` files
- Put production credentials in example files
- Use root-level `.env` files (use app-specific)
