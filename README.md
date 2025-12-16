# SpokeHire Monorepo

A monorepo containing the SpokeHire web application and PayloadCMS admin panel.

## Project Structure

```
SpokeHire/
├── spoke-hire-web/          # Main Next.js web application
├── spoke-hire-cms/          # PayloadCMS admin panel
├── package.json            # Root workspace configuration
└── README.md               # This file
```

## Workspaces

This project uses npm workspaces to manage multiple applications:

1. **spoke-hire-web** - Main customer-facing web application
   - Next.js 15 with App Router
   - tRPC for API
   - Prisma ORM
   - Supabase Auth & Database

2. **spoke-hire-cms** - PayloadCMS admin panel
   - PayloadCMS 3.x
   - Next.js 15
   - Shared Supabase PostgreSQL database
   - Manages content and media

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL (local or Supabase)
- npm 10+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd SpokeHire
```

2. Install dependencies for all workspaces:
```bash
npm install
```

3. Set up environment variables:

**For spoke-hire-web:**
```bash
cd spoke-hire-web
cp env.example.txt .env.local
# Edit .env.local with your credentials
```

**For spoke-hire-cms:**
```bash
cd spoke-hire-cms
cp env.example.txt .env.local
# Edit .env.local with your credentials
# Generate PAYLOAD_SECRET: openssl rand -base64 32
```

4. Run database migrations:
```bash
# For spoke-hire-web (Prisma)
npm run db:migrate -w spoke-hire-web

# For spoke-hire-cms (PayloadCMS)
npm run payload migrate -w spoke-hire-cms
```

### Development

Run both applications:
```bash
npm run dev
```

Or run individually:
```bash
# Web app only (port 3000)
npm run dev:web

# CMS only (port 3001)
npm run dev:cms
```

### Access Points

- **Web App**: http://localhost:3000
- **CMS Admin**: http://localhost:3001/admin

## Available Commands

From the root directory:

```bash
# Development
npm run dev              # Run both apps concurrently
npm run dev:web          # Run web app only
npm run dev:cms          # Run CMS only

# Building
npm run build            # Build both apps
npm run build:web        # Build web app only
npm run build:cms        # Build CMS only

# Quality Checks
npm run lint             # Lint both apps
npm run typecheck        # Type check both apps
```

## Database Architecture

Both applications share the same Supabase PostgreSQL database:

```
Supabase PostgreSQL
├── spoke-hire-web tables (Prisma-managed)
│   ├── User, Vehicle, Deal, etc.
│   └── No prefix
└── spoke-hire-cms tables (Payload-managed)
    ├── payload_users
    ├── payload_media
    └── payload_* prefix
```

## Environment Variables

### spoke-hire-web

Required variables (see `spoke-hire-web/env.example.txt`):
- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- Plus email, AI, and analytics variables

### spoke-hire-cms

Required variables (see `spoke-hire-cms/env.example.txt`):
- `DATABASE_URL` - Same PostgreSQL connection as web app
- `PAYLOAD_SECRET` - Secret key for PayloadCMS (generate with `openssl rand -base64 32`)
- `NEXT_PUBLIC_SERVER_URL` - CMS URL (http://localhost:3001 for dev)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

**Summary:**
- Two separate Vercel projects from the same repo
- spoke-hire-web: Main app at `spokehire.com`
- spoke-hire-cms: Admin at `cms.spokehire.com`
- Both share the same Supabase database

## Documentation

- **spoke-hire-web**: See `spoke-hire-web/README.md` and `spoke-hire-web/docs/`
- **spoke-hire-cms**: 
  - Storage setup: `spoke-hire-cms/STORAGE-SETUP.md`
  - Environment: `spoke-hire-cms/README-ENV.md`
- **Deployment**: `DEPLOYMENT.md`

## Technology Stack

### spoke-hire-web
- Next.js 15 (App Router)
- TypeScript
- tRPC
- Prisma ORM
- Supabase (Auth + Database)
- Tailwind CSS
- shadcn/ui

### spoke-hire-cms
- PayloadCMS 3.x
- Next.js 15
- TypeScript
- PostgreSQL (via @payloadcms/db-postgres)
- Lexical Rich Text Editor

## Contributing

1. Create a feature branch
2. Make changes
3. Run quality checks: `npm run lint && npm run typecheck`
4. Test both apps locally
5. Create a pull request

## Troubleshooting

### Port Conflicts

If ports 3000 or 3001 are in use:

**spoke-hire-web:**
```bash
cd spoke-hire-web
PORT=3002 npm run dev
```

**spoke-hire-cms:**
```bash
cd spoke-hire-cms
PORT=3003 npm run dev
```

### Database Connection Issues

1. Verify `DATABASE_URL` is correct in both `.env.local` files
2. Check Supabase project is active
3. Ensure database migrations have run
4. Use Transaction Pooler connection string for app queries
5. Use Direct Connection for migrations

### Build Errors

```bash
# Clean and rebuild
npm run build:web
npm run build:cms

# Check for TypeScript errors
npm run typecheck
```

## License

[Your License Here]

## Support

For issues and questions:
- Web app: See `spoke-hire-web/README.md`
- CMS: See PayloadCMS docs at https://payloadcms.com/docs
- Deployment: See `DEPLOYMENT.md`



