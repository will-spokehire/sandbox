# Local Development Setup

Complete guide for setting up and running SpokeHire locally with Supabase.

## Overview

This setup provides a complete local development environment including:
- ✅ Local PostgreSQL database (via Supabase)
- ✅ Local Supabase Auth
- ✅ Local Supabase Storage  
- ✅ Production data structure (lookup tables)
- ✅ Email testing (Mailpit)
- ✅ Database management UI (Supabase Studio)

## Prerequisites

- **Docker Desktop** - Must be running
- **Node.js** v18+ and npm
- **PostgreSQL client tools** (for pg_dump) - `brew install postgresql@17`

## Quick Start

### 1. Start Local Supabase

```bash
npm run supabase:start
```

This will:
- Pull required Docker images (first time only)
- Start all Supabase services
- Display connection URLs and credentials

**Output includes:**
- API URL: http://127.0.0.1:54321
- Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- Studio URL: http://127.0.0.1:54323
- Mailpit URL: http://127.0.0.1:54324

### 2. Push Database Schema

```bash
# Use environment variables to target local database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
npm run db:push
```

This creates all tables, indexes, and constraints in your local database.

### 3. Seed Lookup Tables

```bash
npm run seed-lookup-tables
```

This copies lookup data from production:
- Countries (4 records)
- Steering Types (2 records)
- Collections (9 records)
- Makes (~70 records)
- Models (~665 records)

### 4. Create Admin User

```bash
npm run create-admin-user
```

Follow the prompts to create an admin user for testing.

### 5. Start the Application

```bash
npm run dev
```

Navigate to http://localhost:3000 and log in with your admin credentials.

## Environment Variables

The `.env.local` file is automatically created with local Supabase credentials:

```env
# Local Database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Local Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJh..." # Default local key
SUPABASE_SERVICE_ROLE_KEY="eyJh..." # Default local key

# Email Debug Mode
EMAIL_DEBUG="true"
TEST_EMAIL_OVERRIDE="dev@example.com"
```

## Available Commands

### Supabase Management

```bash
# Start all Supabase services
npm run supabase:start

# Stop all services
npm run supabase:stop

# Check status
npm run supabase:status

# Reset database (re-runs migrations + seed)
npm run supabase:reset
```

### Database Management

```bash
# Push Prisma schema to local database
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
npm run db:push

# Open Prisma Studio
npm run db:studio

# Seed lookup tables from production
npm run seed-lookup-tables

# Create admin user
npm run create-admin-user
```

## Accessing Services

### Supabase Studio
- **URL:** http://localhost:54323
- **Use for:** Database browsing, storage management, auth users
- **No login required** for local instance

### Mailpit (Email Testing)
- **URL:** http://localhost:54324
- **Use for:** View all emails sent by the application
- **All emails are intercepted** and displayed here

### Database Direct Access
```bash
# Connect via psql
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Or use your favorite PostgreSQL client
# Host: localhost
# Port: 54322
# Database: postgres
# User: postgres
# Password: postgres
```

## Storage / File Uploads

The `vehicle-images` storage bucket is automatically created. To upload images:

1. Via Supabase Studio:
   - Go to http://localhost:54323
   - Navigate to Storage → vehicle-images
   - Upload files manually

2. Via Application:
   - Upload works the same as production
   - Files stored in Docker volume
   - Accessible at: http://127.0.0.1:54321/storage/v1/object/public/vehicle-images/[filename]

## Resetting Your Local Environment

### Complete Reset
```bash
# Stop Supabase
npm run supabase:stop

# Start fresh
npm run supabase:start

# Re-push schema
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
npm run db:push

# Re-seed lookups
npm run seed-lookup-tables

# Create admin user
npm run create-admin-user
```

### Database Only Reset
```bash
# Reset database to initial state
npm run supabase:reset
```

## Troubleshooting

### "Port already in use"
```bash
# Check what's running
npm run supabase:status

# Stop Supabase
npm run supabase:stop

# Start again
npm run supabase:start
```

### "Docker daemon not running"
- Ensure Docker Desktop is running
- Restart Docker Desktop if needed

### "Connection refused"
```bash
# Check Supabase status
npm run supabase:status

# If not running, start it
npm run supabase:start
```

### "PostGIS extension missing"
```bash
# Enable PostGIS
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
  -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### "Can't connect to production for seeding"
Check your `.env` file has valid production credentials:
```bash
# Verify production connection
grep "DATABASE_URL" .env
```

## Development Workflow

### Daily Development

1. **Start services** (if not running):
   ```bash
   npm run supabase:start
   ```

2. **Start the app**:
   ```bash
   npm run dev
   ```

3. **Make changes** and test locally

4. **View emails** at http://localhost:54324

5. **Check database** at http://localhost:54323

### After Schema Changes

1. **Update Prisma schema** in `prisma/schema.prisma`

2. **Push to local database**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
   DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
   npm run db:push
   ```

3. **Create migration** for production:
   ```bash
   npm run db:generate
   ```

### Testing Features

- **Auth:** All auth emails go to Mailpit (http://localhost:54324)
- **Storage:** Files upload to local storage bucket
- **Database:** All queries run against local PostgreSQL
- **No production impact:** Completely isolated environment

## Differences from Production

| Feature | Local | Production |
|---------|-------|-----------|
| Database | PostgreSQL (Docker) | Supabase hosted PostgreSQL |
| Auth | Local GoTrue | Supabase Auth |
| Storage | Local storage | Supabase Storage |
| Emails | Mailpit (captured) | Loops (sent) |
| URLs | localhost | spokehire.com |
| HTTPS | HTTP only | HTTPS |

## Tips & Best Practices

### Data Seeding
- Lookup tables are seeded from production automatically
- **Never seed** user or vehicle data to avoid PII issues
- Create test data manually as needed

### Environment Switching
- Keep `.env` for production credentials (used by seed script)
- Use `.env.local` for local development (used by Next.js)
- Never commit either file

### Performance
- Local database is typically faster than production
- No network latency for auth/storage operations
- Great for rapid development iteration

### Team Collaboration
- Everyone can run the same local setup
- Share seed scripts, not database dumps
- Document any manual setup steps

## Next Steps

1. ✅ Start Supabase: `npm run supabase:start`
2. ✅ Push schema: `DATABASE_URL="..." npm run db:push`
3. ✅ Seed lookups: `npm run seed-lookup-tables`
4. ✅ Create admin: `npm run create-admin-user`
5. ✅ Start app: `npm run dev`
6. 🎉 Start building!

## Additional Resources

- [Supabase Local Development Docs](https://supabase.com/docs/guides/local-development)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

