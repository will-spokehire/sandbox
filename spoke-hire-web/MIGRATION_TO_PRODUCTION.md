# 🚀 Production Migration Guide

Complete step-by-step guide to migrate your local database to Supabase production.

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ Local database with all your data
- ✅ Supabase account created
- ✅ PostgreSQL client tools installed (`pg_dump`, `psql`)
- ✅ Node.js 18+ installed
- ✅ All dependencies installed (`npm install`)

## 🎯 Migration Overview

This migration process will:
1. Backup your local database
2. Set up Supabase production database
3. Apply database schema
4. Migrate all data to production
5. Verify data integrity
6. Create admin user

**Estimated Time:** 30-60 minutes (depending on data size)

---

## Part 1: Prepare Supabase Production

### Step 1.1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Fill in:
   - **Name:** `spokehire-prod` (or your choice)
   - **Database Password:** Generate a strong password (save it securely!)
   - **Region:** Choose closest to your users
4. Click **"Create new project"**
5. Wait ~2 minutes for provisioning

### Step 1.2: Get Supabase Credentials

1. In Supabase dashboard, go to **Settings → API**
2. Copy these values:

```
Project URL: https://[your-project-ref].supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Go to **Settings → Database**
4. Copy connection strings:

**Transaction pooler (recommended for app):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true
```

**Direct connection (for migrations):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

### Step 1.3: Create Environment File

Create `.env.production` in your project root:

```bash
# Copy the template
cp env.example.txt .env.production
```

Edit `.env.production` with your values:

```bash
# Production Supabase Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Authentication
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Environment
NODE_ENV="production"
```

⚠️ **Important:** Replace `[PROJECT-REF]`, `[PASSWORD]`, and `[REGION]` with your actual values!

---

## Part 2: Backup Local Database

### Step 2.1: Verify Local Data

First, check what you have locally:

```bash
# Make sure your local database is running
# and .env.local is configured correctly

npm run verify-production
```

This shows:
- Record counts
- Data integrity status
- Any issues to fix before migration

### Step 2.2: Create Backup

```bash
# Backup your local database
npm run backup-db
```

This creates:
- `backups/[database]_[timestamp].sql` - Human-readable SQL format
- `backups/[database]_[timestamp].dump` - Compressed custom format
- `backups/[database]_[timestamp]_info.txt` - Backup metadata

✅ **Verify backup was created:**

```bash
ls -lh backups/
```

You should see files created with today's date.

---

## Part 3: Apply Schema to Production

### Step 3.1: Set Production Environment

```bash
# Load production environment variables
export $(cat .env.production | grep -v '^#' | xargs)
```

Or manually:
```bash
export DATABASE_URL="your-production-url"
export DIRECT_URL="your-direct-url"
```

### Step 3.2: Apply Prisma Migrations

```bash
# Generate Prisma client
npx prisma generate

# Apply migrations to production database
npx prisma migrate deploy
```

✅ **Expected output:**
```
Applying migration `20250926192044_`
Applying migration `20250928093613_initail_data`
Applying migration `20250928100200_add_make_model_tables`
```

### Step 3.3: Verify Schema

```bash
# Open Prisma Studio to view production database
npx prisma studio
```

You should see all tables created (empty, but with correct schema).

---

## Part 4: Migrate Data to Production

### Step 4.1: Prepare Migration Environment

Set up both database URLs:

```bash
# Local database
export LOCAL_DATABASE_URL="postgresql://postgres:password@localhost:5432/spokehire_local"

# Production database
export PRODUCTION_DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.com:5432/postgres"
```

Or use your configured databases:

```bash
# Use local .env.local for source
export LOCAL_DATABASE_URL=$(grep DATABASE_URL .env.local | cut -d '=' -f2- | tr -d '"')

# Use .env.production for destination
export PRODUCTION_DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"' | head -1)
```

### Step 4.2: Run Migration

```bash
npm run migrate-to-production
```

You'll be prompted:
1. **Type "MIGRATE"** to confirm
2. If production database has data, type **"OVERWRITE"** to continue

Migration process:
- ✅ Migrates reference data (countries, makes, models, etc.)
- ✅ Migrates users
- ✅ Migrates vehicles
- ✅ Migrates media
- ✅ Migrates relationships
- ✅ Verifies data integrity

**Expected output:**
```
📚 Migrating reference data...
   ✅ Migrated 5 countries
   ✅ Migrated 2 steering types
   ✅ Migrated 150 makes
   ✅ Migrated 500 models
   ✅ Migrated 10 collections

👥 Migrating users...
   ✅ Migrated 875 users

🚗 Migrating vehicles...
   ✅ Migrated 1638 vehicles

📸 Migrating media...
   ✅ Migrated 5000 media items

✅ Migration completed successfully!
```

---

## Part 5: Verify Production Database

### Step 5.1: Run Verification

```bash
# Set DATABASE_URL to production
export DATABASE_URL="your-production-database-url"

# Run verification
npm run verify-production
```

This checks:
- ✅ Record counts match
- ✅ No orphaned records
- ✅ All relationships intact
- ✅ Data integrity

### Step 5.2: Manual Verification (Optional)

Connect to Supabase database:

```bash
psql "your-production-database-url"
```

Run these queries:

```sql
-- Check record counts
SELECT 'Users' as table, COUNT(*) FROM "User"
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM "Vehicle"
UNION ALL
SELECT 'Media', COUNT(*) FROM "Media";

-- Check vehicles by status
SELECT status, COUNT(*) FROM "Vehicle" GROUP BY status;

-- Check for orphaned records
SELECT COUNT(*) FROM "Vehicle" WHERE "ownerId" NOT IN (SELECT id FROM "User");
SELECT COUNT(*) FROM "Media" WHERE "vehicleId" NOT IN (SELECT id FROM "Vehicle");
```

All counts should match your local database!

---

## Part 6: Create Admin User

### Step 6.1: Set Environment

Make sure you're using production:

```bash
export DATABASE_URL="your-production-url"
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 6.2: Create Admin

```bash
npm run create-admin-user
```

Follow prompts:
- **Email:** Your admin email
- **First Name:** Your first name
- **Last Name:** Your last name

This creates:
1. User in Supabase Auth
2. User record in your database with ADMIN role

✅ **Test admin login:**
1. Go to your app URL
2. Navigate to `/auth/login`
3. Enter admin email
4. Check email for OTP code
5. Enter OTP to login

---

## Part 7: Deploy Application

### Option A: Deploy to Vercel

1. Push code to GitHub:
```bash
git add .
git commit -m "Ready for production deployment"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click **"New Project"**
4. Import your GitHub repository
5. Add environment variables from `.env.production`:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
6. Click **"Deploy"**

### Option B: Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

---

## 🔍 Troubleshooting

### Issue: Migration Fails with "Connection Error"

**Solution:**
1. Check DATABASE_URL is correct
2. Verify Supabase project is running
3. Check if your IP is whitelisted in Supabase (Settings → Database → Connection pooling)

### Issue: "Orphaned records found"

**Solution:**
1. Run verification on local database first
2. Fix any integrity issues locally
3. Re-run migration

### Issue: "Tables already exist"

**Solution:**
```bash
# Reset production database (⚠️ This deletes all data!)
npx prisma migrate reset

# Or drop specific tables in Supabase SQL Editor
```

### Issue: Environment variables not loading

**Solution:**
```bash
# Make sure to export variables
export $(cat .env.production | grep -v '^#' | xargs)

# Or use source
source .env.production

# Verify they're set
echo $DATABASE_URL
```

---

## 📊 Post-Migration Checklist

After successful migration:

- [ ] Production database has all data
- [ ] Verification shows no errors
- [ ] Admin user can login
- [ ] Application works with production database
- [ ] Backups are stored securely
- [ ] .env.production is NOT in git
- [ ] Environment variables set in Vercel/deployment platform
- [ ] Monitor Supabase dashboard for performance

---

## 🔐 Security Best Practices

1. **Never commit `.env.production`** - Already in `.gitignore`
2. **Rotate passwords regularly** - Update in Supabase dashboard
3. **Enable Row Level Security (RLS)** - In Supabase if needed
4. **Monitor auth logs** - Check for suspicious activity
5. **Set up automated backups** - Enable in Supabase dashboard
6. **Use environment variables** - Never hardcode credentials

---

## 🆘 Rollback Plan

If something goes wrong:

### Rollback Database:
```bash
# Restore from backup
psql "your-production-url" < backups/spokehire_local_[timestamp].sql

# Or from custom format
pg_restore -d "your-production-url" --clean --if-exists backups/spokehire_local_[timestamp].dump
```

### Rollback Application:
1. In Vercel: Go to Deployments → Click previous deployment → Promote to Production
2. Manual: `git revert` and redeploy

---

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [PostgreSQL Backup/Restore](https://www.postgresql.org/docs/current/backup.html)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## ✅ Success!

You've successfully migrated to production! 🎉

**Next steps:**
1. Monitor application performance
2. Set up automated backups
3. Configure email templates in Supabase
4. Add more admin users as needed
5. Enable production features

Need help? Check the troubleshooting section or review the logs.

