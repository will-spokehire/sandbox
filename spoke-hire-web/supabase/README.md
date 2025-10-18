# Supabase Local Development

This directory contains the local Supabase configuration and database backups.

## Directory Structure

```
supabase/
├── config.toml          # Supabase local configuration
├── migrations/          # Database migrations (if using)
└── README.md            # This file
```

## Configuration

The `config.toml` file configures local Supabase services:
- **Database Port:** 54322
- **API Port:** 54321
- **Studio Port:** 54323
- **Email Testing Port:** 54324

## Seeding Data

Lookup tables are seeded directly from production using Prisma:

```bash
npm run seed-lookup-tables
```

This copies:
- Countries
- Makes
- Models  
- Steering Types
- Collections

## Quick Reference

### Start Supabase
```bash
npm run supabase:start
```

### Stop Supabase
```bash
npm run supabase:stop
```

### Check Status
```bash
npm run supabase:status
```

### Reset Database
```bash
npm run supabase:reset
```

## Environment Variables

Local Supabase uses default credentials:
- **Database:** postgres / postgres @ localhost:54322
- **Anon Key:** Default Supabase demo key
- **Service Role Key:** Default Supabase demo key

These are configured in `.env.local` (auto-generated).

## See Also

- [Local Development Guide](../docs/setup/local-development.md) - Complete setup instructions
- [Supabase Docs](https://supabase.com/docs/guides/local-development) - Official documentation

