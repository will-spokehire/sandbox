# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Commits

Never add Claude as a co-author in commit messages.

## Overview

SpokeHire is a monorepo containing two Next.js applications:
- **`spoke-hire-web`** — Main application (Next.js 15, tRPC, Prisma, Supabase Auth)
- **`spoke-hire-cms`** — Content management (Next.js 15 + PayloadCMS 3.x)

Both share a single Supabase PostgreSQL database using separate schemas (`public` for Prisma, `payload` for CMS).

## Commands

### Root (monorepo)
```bash
npm run dev:web          # Start web app on port 3000
npm run dev:cms          # Start CMS on port 3001
npm run install:all      # Install dependencies for all workspaces
```

### Web app (`cd spoke-hire-web`)
```bash
npm run dev              # Dev server with Turbo
npm run build            # Production build
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run typecheck        # TypeScript validation
npm run check            # lint + typecheck combined
npm run db:migrate       # Prisma migration deploy
npm run db:push          # Sync schema without migration
npm run db:studio        # Open Prisma Studio
```

### CMS (`cd spoke-hire-cms`)
```bash
npm run dev              # Dev server
npm run build            # Production build
npm run test:int         # Vitest integration tests
npm run test:e2e         # Playwright E2E tests
npm run seed             # Seed database
```

## Architecture

### Web App (`spoke-hire-web/src/`)

**API Layer — tRPC 11**
- Routers live in `server/api/routers/` — one per domain (`vehicle`, `publicVehicle`, `userVehicle`, `deal`, `media`, `user`, `auth`, `make`)
- Business logic in `server/api/services/`, data access in `server/api/repositories/`, complex filtering via `server/api/builders/`
- Server Components call tRPC via the `api` helper (in `trpc/server.ts`) directly; Client Components use React Query hooks via `trpc/react.tsx`

**Authentication**
- Supabase Auth with Email OTP + Google OAuth
- `middleware.ts` refreshes Supabase session tokens on every request using `@supabase/ssr`
- `src/lib/supabase/` contains server/client/middleware helper factories
- `useRequireAdmin` hook guards admin-only client routes

**Database**
- Prisma 6 + Supabase PostgreSQL
- Use `DATABASE_URL` (transaction pooler, `pgbouncer=true`) for app queries; `DIRECT_URL` (direct connection) for migrations
- Prisma Accelerate extension is active for edge query caching

**Environment validation**
- All env vars are declared and validated in `src/env.js` using `t3-oss/env-nextjs`; import from there, not `process.env` directly

**Path alias**
- `~/*` maps to `./src/*` in the web app
- `@/*` maps to `./src/*` in the CMS

### CMS (`spoke-hire-cms/src/`)

- Collections: Users, Media, Icons, Stats, ValueProps, CTABlocks, Testimonials, FAQs, CarouselImages, Spotlights, StaticPages, StaticBlocks
- Globals: Navigation, SiteSettings
- Storage: local filesystem in dev, Supabase S3-compatible API in production (auto-switched by `NODE_ENV`)
- Schema is isolated to the `payload` Postgres schema (configurable via `PAYLOAD_DB_SCHEMA`)

### CMS → Web Integration
- Web app fetches CMS content via REST API (`NEXT_PUBLIC_PAYLOAD_API_URL`) using `src/lib/payload-api.ts`
- On-demand revalidation uses a shared `REVALIDATION_SECRET`

## Key Dependencies

| Concern | Library |
|---|---|
| UI components | shadcn/ui + Radix UI + Tailwind CSS v4 |
| Forms | React Hook Form + Zod |
| Email | Loops.so (`LOOPS_API_KEY`) |
| AI descriptions | Google Gemini (`GOOGLE_GENERATIVE_AI_API_KEY`) |
| File uploads | tus.js (chunked, resumable) |
| Analytics | Google Analytics 4 + Amplitude |

## Deployment

Two separate Vercel projects point at this monorepo with different root directories (`spoke-hire-web` and `spoke-hire-cms`). See `DEPLOYMENT.md` for environment variable setup and Vercel project configuration.
