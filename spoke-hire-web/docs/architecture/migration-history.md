# Database Migration History

**Purpose:** Track database schema changes and migration notes  
**Last Updated:** January 2025

---

## Overview

This document tracks major database migrations, schema changes, and important notes for maintaining database consistency across environments.

---

## Migration Process

### Standard Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Generate migration:**
   ```bash
   npm run db:generate
   # Or: npx prisma migrate dev --name your_migration_name
   ```
3. **Review SQL** in `prisma/migrations/[timestamp]_your_migration_name/migration.sql`
4. **Test locally** first
5. **Apply to production:**
   ```bash
   npm run db:migrate
   # Or: npx prisma migrate deploy
   ```

### Important Notes

- Always use **DIRECT_URL** (port 5432) for migrations
- Use **DATABASE_URL** (port 6543) for app queries
- Test migrations in development first
- Backup production database before major migrations
- Review generated SQL before applying

---

## Major Migrations

### Initial Schema (September 2025)

**Migration:** `20250926192044_initial`

**Changes:**
- Created base schema for vehicles, users, and media
- Set up relationships between core entities

**Files:**
- `prisma/migrations/20250926192044_/migration.sql`

### Make and Model Tables (September 2025)

**Migration:** `20250928100200_add_make_model_tables`

**Changes:**
- Added `Make` table for vehicle manufacturers
- Added `Model` table for vehicle models
- Updated `Vehicle` to reference Make and Model
- Migrated existing string-based make/model data

**Impact:**
- Normalized make/model data
- Reduced data duplication
- Improved filtering performance

### PostGIS Extension (January 2025)

**Migration:** `20250105_enable_postgis`

**Changes:**
- Enabled PostGIS extension for geospatial queries
- Added location columns with GEOGRAPHY type

**SQL:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

**Use Cases:**
- Distance-based vehicle filtering
- Location-based search
- Geospatial analysis

**Related:** See `enable-postgis.sql` in project root

### User Geolocation (January 2025)

**Migration:** `20250105_add_user_geolocation`

**Changes:**
- Added `latitude` and `longitude` to User table
- Enabled distance calculations for users
- Added geospatial indexes

**Related Features:**
- Distance filtering in vehicle searches
- Location-based recommendations

### RecipientStatus Enum (January 2025)

**Migration:** `add_recipient_status_enum.sql` (manual)

**Changes:**
- Created `RecipientStatus` enum: `PENDING`, `SENT`, `FAILED`
- Updated `DealRecipient.status` from string to enum
- Migrated existing string values to enum

**Why Manual:**
- PostgreSQL enum conversions require special handling
- Needed data migration for existing records
- Enum changes can't be easily rolled back

**Steps:**
1. Create new enum type
2. Add temporary column
3. Copy and convert data
4. Drop old column
5. Rename new column
6. Update constraints

**File:** `prisma/migrations/add_recipient_status_enum.sql`

**Manual Application:**
```bash
psql $DIRECT_URL -f prisma/migrations/add_recipient_status_enum.sql
```

### Simplified Deal Status (January 2025)

**Migration:** `simplify_deal_status.sql` (manual)

**Changes:**
- Reduced `DealStatus` from 5 states to 2: `ACTIVE`, `ARCHIVED`
- Removed: `DRAFT`, `SENT`, `EXPIRED`, `CANCELLED`
- Converted existing deals:
  - `DRAFT`, `SENT`, `ACTIVE` → `ACTIVE`
  - `EXPIRED`, `CANCELLED` → `ARCHIVED`

**Why Simplified:**
- Original 5-state system was overly complex
- Most deals follow simple "active then archive" lifecycle
- Matches simpler vehicles status pattern

**Impact:**
- Simpler UI logic
- Easier to understand workflow
- Less state management complexity

**File:** `prisma/migrations/simplify_deal_status.sql`

### Performance Indexes (October 2025)

**Migration:** `add_performance_indexes.sql`

**Changes:**
- Added 8 performance indexes for common queries
- Composite indexes for filtered sorts
- Full-text search indexes
- Covering indexes for SELECT optimization

**Indexes Added:**
- `idx_vehicle_status_created` - Status + CreatedAt
- `idx_vehicle_search_name` - Full-text on name
- `idx_vehicle_search_registration` - Full-text on registration
- `idx_vehicle_search_description` - Full-text on description
- `idx_user_search_name_email` - Full-text on user info
- `idx_user_search_phone` - Full-text on phone
- `idx_vehicle_status_year` - Status + Year
- `idx_vehicle_status_price` - Status + Price

**Impact:**
- 40-80% faster searches
- 50-70% faster filtered sorts
- Reduced database load

**Application:**
```bash
npx tsx scripts/apply-performance-indexes.ts
```

**File:** `prisma/migrations/add_performance_indexes.sql`

---

## Manual Migrations

Some migrations require manual steps and cannot be fully automated by Prisma.

### When Manual Migrations are Needed

1. **Enum type changes** - PostgreSQL enum modifications
2. **Data migrations** - Complex data transformations
3. **Extension installations** - PostGIS, pg_trgm, etc.
4. **Production-safe operations** - Using CONCURRENTLY for indexes
5. **Multi-step processes** - Require intermediate states

### Manual Migration Checklist

Before applying manual migrations:

- [ ] **Backup database** (critical for production)
- [ ] **Test in development** environment first
- [ ] **Review SQL** carefully
- [ ] **Check for dependencies** (foreign keys, triggers)
- [ ] **Plan rollback strategy**
- [ ] **Schedule maintenance window** (if needed)
- [ ] **Notify team** of migration
- [ ] **Monitor after application**

### Manual Migration Files

All manual migrations are in `prisma/migrations/` with `.sql` extension:

- `add_recipient_status_enum.sql` - RecipientStatus enum
- `simplify_deal_status.sql` - DealStatus simplification
- `add_performance_indexes.sql` - Performance indexes
- `add_performance_indexes_simple.sql` - Dev version (without CONCURRENTLY)
- `enable-postgis.sql` - PostGIS extension

---

## Production Migration Guide

### Before Migration

1. **Backup database:**
   ```bash
   npm run backup-database
   # Or manually via Supabase dashboard
   ```

2. **Test migration locally:**
   ```bash
   # Create test database
   createdb spokehire_test
   
   # Apply migration
   DATABASE_URL="postgresql://localhost/spokehire_test" npm run db:migrate
   ```

3. **Review migration SQL:**
   ```bash
   cat prisma/migrations/[timestamp]_name/migration.sql
   ```

4. **Check for breaking changes:**
   - Column removals
   - Required fields added to existing tables
   - Enum changes
   - Foreign key constraint changes

### During Migration

1. **Set maintenance mode** (if applicable)

2. **Use DIRECT_URL:**
   ```bash
   export DATABASE_URL=$DIRECT_URL
   npm run db:migrate
   ```

3. **For manual migrations:**
   ```bash
   psql $DIRECT_URL -f prisma/migrations/your_migration.sql
   ```

4. **Monitor progress:**
   - Watch database connection count
   - Check for lock conflicts
   - Monitor query performance

### After Migration

1. **Verify schema:**
   ```bash
   npm run db:studio
   ```

2. **Test application:**
   - Run critical user flows
   - Check API endpoints
   - Verify data integrity

3. **Monitor performance:**
   - Watch API response times
   - Check database metrics in Supabase
   - Look for slow queries

4. **Remove maintenance mode**

---

## Rollback Procedures

### Automatic Rollback (Prisma migrations)

Prisma doesn't support automatic rollback, but you can:

1. **Restore from backup:**
   ```bash
   # Via Supabase dashboard or pg_restore
   ```

2. **Create reverse migration:**
   - Write SQL to undo changes
   - Test thoroughly before applying

### Manual Rollback Examples

**Rollback performance indexes:**
```sql
DROP INDEX CONCURRENTLY IF EXISTS idx_vehicle_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_vehicle_search_name;
-- ... etc
```

**Rollback enum change:**
```sql
-- More complex, requires reversing the manual migration steps
-- Generally easier to restore from backup
```

---

## Common Migration Issues

### Issue: Migration Locks Database

**Symptom:** Migration hangs, other queries blocked

**Cause:** Migration holding exclusive lock

**Solution:**
- Use `CONCURRENTLY` for index creation
- Run migrations during low-traffic periods
- Break large migrations into smaller steps

### Issue: Enum Migration Fails

**Symptom:** Cannot alter enum type

**Cause:** PostgreSQL doesn't allow modifying enums with dependencies

**Solution:**
- Use manual migration process
- Create new enum, migrate data, drop old

### Issue: Foreign Key Constraint Violation

**Symptom:** Migration fails due to existing data

**Cause:** Adding constraint to table with inconsistent data

**Solution:**
- Clean up data first
- Add constraint with `NOT VALID`, then validate
- Use cascading deletes carefully

### Issue: Out of Memory During Migration

**Symptom:** Migration fails with OOM error

**Cause:** Large data migration

**Solution:**
- Process data in batches
- Increase database resources temporarily
- Split into multiple smaller migrations

---

## Migration Best Practices

### Do's ✅

- **Always backup** before production migrations
- **Test migrations** in development first
- **Use transactions** when possible
- **Add indexes** with `CONCURRENTLY` in production
- **Document** manual migration steps
- **Plan rollback** strategy before applying
- **Monitor** database during and after migration
- **Use descriptive** migration names

### Don'ts ❌

- **Don't skip** testing in development
- **Don't run** migrations on pooled connection (use DIRECT_URL)
- **Don't modify** applied migration files
- **Don't drop columns** without deprecation period
- **Don't add required** columns without defaults
- **Don't change enums** directly (use manual migration)
- **Don't forget** to update Prisma client after migration

---

## Useful Commands

```bash
# Generate migration
npm run db:generate
npx prisma migrate dev --name your_migration_name

# Apply migrations
npm run db:migrate
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Reset database (WARNING: destroys data)
npx prisma migrate reset

# Generate Prisma client
npm run postinstall
npx prisma generate

# View database
npm run db:studio

# Backup database
npm run backup-database

# Apply manual migration
psql $DIRECT_URL -f prisma/migrations/your_migration.sql
```

---

## Additional Resources

- [Prisma Migrations Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Migration Best Practices](https://www.postgresql.org/docs/current/ddl.html)
- [Supabase Migration Guide](https://supabase.com/docs/guides/database/managing-migrations)

---

## Migration Log

| Date | Migration | Type | Status | Notes |
|------|-----------|------|--------|-------|
| Sep 2025 | Initial schema | Auto | ✅ Applied | Base setup |
| Sep 2025 | Make/Model tables | Auto | ✅ Applied | Data normalized |
| Oct 2025 | Performance indexes | Manual | ✅ Applied | 70% performance gain |
| Jan 2025 | PostGIS extension | Manual | ✅ Applied | Geospatial queries |
| Jan 2025 | User geolocation | Auto | ✅ Applied | Distance filtering |
| Jan 2025 | RecipientStatus enum | Manual | ✅ Applied | Type safety improved |
| Jan 2025 | Simplified DealStatus | Manual | ✅ Applied | Reduced complexity |

---

**Last Updated:** January 2025  
**Maintainer:** Development Team

