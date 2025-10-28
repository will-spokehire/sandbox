# Preview Environment Setup Guide

Complete guide for setting up a preview deployment on Vercel with a new Supabase instance.

## Overview

This guide covers:
- Creating a new Supabase project for preview
- Setting up database with PostGIS and RLS
- Migrating subset of production data
- Configuring Vercel for preview deployments

---

## Prerequisites

- Access to Supabase dashboard
- Access to Vercel project
- Production data available in `/data-analytics/data/`
- Node.js and npm installed

---

## Part 1: Create Preview Supabase Project

### Step 1: Create New Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `spokehire-preview`
   - **Database Password**: Generate strong password (save this!)
   - **Region**: Same as production (for consistency)
4. Click **"Create new project"**
5. Wait for provisioning (~2 minutes)

### Step 2: Get Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key ⚠️ Keep secret!

3. Go to **Settings** → **Database**
4. Under **Connection pooling**, copy:
   - **Connection string** (Transaction mode, port 6543)
   - Note: Replace `[YOUR-PASSWORD]` with actual password

5. Under **Connection string**, copy:
   - **Direct connection** (port 5432)

---

## Part 2: Configure Environment

### Create Environment File

Create `.env.preview` in project root:

```bash
# Preview Supabase Database
PREVIEW_DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
PREVIEW_DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Preview Supabase Auth & Storage
PREVIEW_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
PREVIEW_SUPABASE_ANON_KEY="eyJhbGc..."
PREVIEW_SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# Optional: Email settings
EMAIL_DEBUG="true"
TEST_EMAIL_OVERRIDE="preview-test@example.com"
```

### Load Environment Variables

```bash
# Option 1: Export in current shell
export $(cat .env.preview | xargs)

# Option 2: Use with each command
source .env.preview && npm run preview:db:setup
```

---

## Part 3: Setup Database

### Full Setup (Recommended)

Run complete setup in one command:

```bash
npm run preview:db:setup
```

This will:
1. ✅ Enable PostGIS extension
2. ✅ Push Prisma schema
3. ✅ Apply RLS policies
4. ✅ Create performance indexes
5. ✅ Create triggers
6. ✅ Setup storage bucket

### Step-by-Step Setup

Or run individual steps:

```bash
# 1. Enable PostGIS
npm run preview:db:postgis

# 2. Push database schema
npm run preview:db:schema

# 3. Apply RLS policies
npm run preview:db:rls

# 4. Create performance indexes
npm run preview:db:indexes

# 5. Create database triggers
npm run preview:db:triggers

# 6. Setup storage bucket
npm run preview:db:storage
```

### Verify Setup

Check that everything is configured correctly:

```bash
npm run preview:db:verify
```

Expected output:
```
✅ PostGIS 3.x.x
✅ All 14 required tables exist
✅ All tables have RLS enabled
✅ Spatial indexes: 1
✅ Composite indexes: 3
✅ geoPoint trigger exists
✅ vehicle-images bucket exists
✅ Bucket is public
✅ 4 storage RLS policies found
```

---

## Part 4: Migrate Data (Coming Next)

After database setup is complete, you'll run data migration to populate with a subset of production data.

```bash
# This will be implemented in the next script
npm run preview:data:migrate
```

---

## Troubleshooting

### PostGIS Already Enabled

**Error**: `extension "postgis" already exists`

**Solution**: This is safe to ignore. PostGIS is already enabled.

### Permission Denied

**Error**: `permission denied for schema public`

**Solution**: Make sure you're using `PREVIEW_DIRECT_URL` (direct connection, not pooled).

### RLS Policies Already Exist

**Error**: `policy "service_role_only_*" already exists`

**Solution**: This is safe to ignore. Policies are already applied.

### Storage Bucket Already Exists

**Error**: `Bucket already exists`

**Solution**: This is normal. The script will update the existing bucket.

### Connection Timeout

**Error**: `Connection timeout`

**Solution**: 
1. Check that Supabase project is running
2. Verify connection string is correct
3. Check firewall/network settings

---

## Security Checklist

Before using preview environment:

- [ ] SERVICE_ROLE key is kept secret (not in client code)
- [ ] RLS enabled on all tables
- [ ] Storage RLS policies applied
- [ ] Bucket is public for image viewing
- [ ] Email debug mode enabled (no real emails sent)
- [ ] Test email override configured

---

## Next Steps

1. ✅ Database setup complete
2. ⏳ Migrate subset of data
3. ⏳ Create admin user
4. ⏳ Configure Vercel
5. ⏳ Deploy preview branch

Continue to data migration guide...

---

## Commands Reference

### Database Setup
```bash
npm run preview:db:setup      # Full setup
npm run preview:db:verify     # Verify setup
npm run preview:db:postgis    # Enable PostGIS only
npm run preview:db:schema     # Push schema only
npm run preview:db:rls        # Apply RLS only
npm run preview:db:indexes    # Create indexes only
npm run preview:db:triggers   # Create triggers only
npm run preview:db:storage    # Setup storage only
```

### Environment
```bash
# Load preview environment
source .env.preview

# Or export variables
export $(cat .env.preview | xargs)
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Main Setup Guide](./supabase-setup.md)
- [Database Schema](../../prisma/schema.prisma)

---

**Last Updated**: January 2025

