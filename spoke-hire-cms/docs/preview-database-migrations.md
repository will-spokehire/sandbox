# Preview Database Migration Guide

Complete guide for understanding and managing PayloadCMS database migrations in preview environments.

## Overview

PayloadCMS automatically runs database migrations on application startup. This guide explains how migrations work, how to verify they've run successfully, and how to manually trigger them if needed.

## How PayloadCMS Migrations Work

### Automatic Migrations

PayloadCMS runs migrations **automatically** when the application starts:

1. **On Application Startup**: When PayloadCMS initializes, it checks the `payload_migrations` table
2. **Compares Migrations**: Compares pending migrations in code with applied migrations in database
3. **Runs Pending Migrations**: Automatically executes any migrations that haven't been applied yet
4. **Tracks Status**: Records completed migrations in `payload.payload_migrations` table

### Migration Files

Migrations are located in `src/migrations/`:
- Each migration has a timestamp name (e.g., `20251215_193332.ts`)
- Migrations export `up()` and `down()` functions
- The `index.ts` file registers all migrations

### Schema Isolation

- PayloadCMS uses the **`payload`** schema (configurable via `PAYLOAD_DB_SCHEMA`)
- This is separate from `spoke-hire-web` tables (which use `public` schema)
- Both schemas exist in the same Supabase PostgreSQL database

---

## Automatic Migrations on Deploy

### What Happens on Preview Deploy

When you deploy to Vercel preview:

1. **Build Phase**: Next.js builds the application
2. **Startup Phase**: PayloadCMS initializes
3. **Migration Check**: PayloadCMS checks for pending migrations
4. **Auto-Migration**: Runs any pending migrations automatically
5. **Application Ready**: CMS becomes available after migrations complete

### No Manual Action Required

✅ **Migrations run automatically** - you don't need to run them manually  
✅ **Idempotent** - running migrations multiple times is safe  
✅ **Tracked** - PayloadCMS knows which migrations have been applied

---

## Manual Migration Commands

While migrations run automatically, you can also run them manually if needed:

### Prerequisites

1. **Set up environment variables**:
   ```bash
   # Load preview environment
   export $(cat .env.preview | xargs)
   # Or set DATABASE_URL directly
   export DATABASE_URL="postgresql://..."
   ```

2. **Navigate to CMS directory**:
   ```bash
   cd spoke-hire-cms
   ```

### Run Migrations

```bash
# Run all pending migrations
npm run payload migrate

# Or using pnpm (if that's your package manager)
pnpm payload migrate
```

### What This Does

- Connects to the database using `DATABASE_URL`
- Checks which migrations are pending
- Runs pending migrations in order
- Updates `payload.payload_migrations` table

### Verify Migrations Ran

After running migrations, check the output:
```
✅ Migration 20251215_193332 applied
✅ Migration 20251216_120216 applied
...
```

---

## Verifying Schema Setup

### Check if Schema Exists

Connect to your preview Supabase database and run:

```sql
-- Check if payload schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'payload';
```

Expected result: Should return one row with `payload`

### Check if Tables Exist

```sql
-- List all tables in payload schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'payload'
ORDER BY table_name;
```

Expected tables:
- `payload_migrations` - Tracks applied migrations
- `users` - CMS admin users
- `users_sessions` - User sessions
- `media` - Uploaded media files
- `payload_kv` - Key-value store
- `payload_preferences` - User preferences
- `payload_locked_documents` - Document locking
- Plus tables for your collections (hero_slides, stats, etc.)

### Check Migration Status

```sql
-- See which migrations have been applied
SELECT name, batch, created_at 
FROM payload.payload_migrations 
ORDER BY batch, created_at;
```

This shows:
- `name` - Migration timestamp/name
- `batch` - Batch number (migrations run in batches)
- `created_at` - When migration was applied

### Verify Schema Name

If you're using a custom schema name (not `payload`):

```sql
-- Check current schema setting
SHOW search_path;

-- Or check environment variable
-- PAYLOAD_DB_SCHEMA should match your schema name
```

---

## Troubleshooting

### Migrations Not Running

**Problem**: Migrations don't run automatically on deploy

**Solutions**:
1. **Check DATABASE_URL**:
   - Verify `DATABASE_URL` is set in Vercel (Preview environment)
   - Ensure connection string is correct
   - Test connection manually

2. **Check Database Connection**:
   - Verify Supabase project is active
   - Check database password is correct
   - Ensure network/firewall allows connections

3. **Check Logs**:
   - Go to Vercel → Deployments → [Your Deployment] → Logs
   - Look for migration-related errors
   - Check for database connection errors

4. **Manual Migration**:
   - Run migrations manually: `npm run payload migrate`
   - Check for specific error messages

### "Schema Already Exists" Errors

**Problem**: Error about schema already existing

**Solution**: This is normal and safe to ignore. The migration uses `CREATE SCHEMA IF NOT EXISTS`, so it won't fail if schema exists.

### "Table Already Exists" Errors

**Problem**: Error about tables already existing

**Solutions**:
1. **Check migration status**:
   ```sql
   SELECT * FROM payload.payload_migrations;
   ```
   - If migrations are recorded, tables should exist
   - This error might indicate a partial migration

2. **Verify table structure**:
   ```sql
   \d payload.users  -- Check if table structure is correct
   ```

3. **Re-run migrations**:
   - PayloadCMS migrations are idempotent
   - Re-running should be safe
   - If errors persist, check migration files

### Connection Timeout

**Problem**: Database connection times out during migration

**Solutions**:
1. **Use Direct Connection**:
   - For migrations, use `DIRECT_URL` (port 5432)
   - Not the pooled connection (port 6543)
   - Pooled connections may timeout for long operations

2. **Check Supabase Status**:
   - Verify Supabase project is running
   - Check for maintenance or issues

3. **Increase Timeout**:
   - Some migrations may take time
   - Check Vercel function timeout limits

### Missing Tables

**Problem**: Some tables are missing after migration

**Solutions**:
1. **Check migration status**:
   ```sql
   SELECT * FROM payload.payload_migrations 
   ORDER BY batch DESC;
   ```
   - Verify all migrations were applied
   - Check if any migrations failed

2. **Check migration files**:
   - Verify all migrations are in `src/migrations/index.ts`
   - Ensure migration files are included in build

3. **Re-run migrations**:
   ```bash
   npm run payload migrate
   ```

### Wrong Schema

**Problem**: Tables created in wrong schema

**Solutions**:
1. **Check PAYLOAD_DB_SCHEMA**:
   - Verify environment variable is set correctly
   - Default is `payload` if not set
   - Should match your intended schema name

2. **Verify Schema Name**:
   ```sql
   SELECT current_schema();
   -- Should show 'payload' or your custom schema
   ```

3. **Check Table Locations**:
   ```sql
   SELECT schemaname, tablename 
   FROM pg_tables 
   WHERE tablename LIKE 'payload%';
   ```

---

## Migration Best Practices

### 1. Always Test Locally First

Before deploying to preview:
```bash
# Test migrations locally with preview database
export DATABASE_URL="your-preview-database-url"
npm run payload migrate
```

### 2. Backup Before Major Migrations

For production or important preview data:
```sql
-- Create backup of payload schema
pg_dump -h [host] -U [user] -d [database] -n payload > payload_backup.sql
```

### 3. Monitor Migration Logs

Check Vercel deployment logs for:
- Migration start/end messages
- Any errors or warnings
- Migration execution time

### 4. Verify After Deploy

After preview deployment:
1. Check admin panel loads
2. Verify collections are accessible
3. Test creating/editing content
4. Check database directly if needed

### 5. Keep Migrations in Sync

- Don't delete migration files
- Keep migrations in version control
- Ensure all environments have same migration files

---

## Understanding Migration Structure

### Migration File Example

```typescript
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "payload"."my_table" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL
    );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "payload"."my_table";
  `)
}
```

### Migration Registration

All migrations must be registered in `src/migrations/index.ts`:

```typescript
import * as migration_20251215_193332 from './20251215_193332';

export const migrations = [
  {
    up: migration_20251215_193332.up,
    down: migration_20251215_193332.down,
    name: '20251215_193332',
  },
  // ... more migrations
];
```

---

## Common Migration Scenarios

### First Time Setup

When setting up preview for the first time:

1. **Database connection configured** ✅
2. **Deploy to Vercel** - Migrations run automatically
3. **Verify schema created**:
   ```sql
   SELECT * FROM payload.payload_migrations;
   ```
4. **Check tables exist**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'payload';
   ```

### Adding New Collections

When you add a new collection:

1. **Update payload.config.ts** - Add collection to config
2. **Generate migration** (if needed):
   ```bash
   npm run payload migrate:create
   ```
3. **Deploy** - Migration runs automatically
4. **Verify** - Check new table exists in database

### Updating Existing Collections

When modifying collection fields:

1. **Update collection definition**
2. **PayloadCMS generates migration automatically**
3. **Deploy** - Migration runs automatically
4. **Verify** - Check table structure updated

---

## Verification Checklist

After preview deployment, verify migrations:

- [ ] Preview deployment completed successfully
- [ ] No migration errors in Vercel logs
- [ ] `payload` schema exists in database
- [ ] `payload_migrations` table exists and has records
- [ ] All expected tables exist (users, media, collections, etc.)
- [ ] Can access CMS admin panel
- [ ] Can create/edit content in collections
- [ ] Database queries work correctly

---

## Quick Reference

### Check Migration Status
```sql
SELECT * FROM payload.payload_migrations ORDER BY batch DESC;
```

### List All Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'payload' ORDER BY table_name;
```

### Manual Migration Command
```bash
npm run payload migrate
```

### Check Schema Exists
```sql
SELECT schema_name FROM information_schema.schemata 
WHERE schema_name = 'payload';
```

---

## Additional Resources

- [PayloadCMS Migrations Documentation](https://payloadcms.com/docs/database/migrations)
- [PostgreSQL Schema Documentation](https://www.postgresql.org/docs/current/ddl-schemas.html)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)

---

**Last Updated**: January 2025


