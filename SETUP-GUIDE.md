# SpokeHire Monorepo - Complete Setup Guide

This guide will walk you through setting up the entire SpokeHire monorepo from scratch.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.20.2 or higher (22.x recommended)
- **npm** 10.0.0 or higher
- **PostgreSQL** database (local or Supabase)
- **Git** installed
- A **Supabase** account (for cloud deployment)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd SpokeHire

# Install all workspace dependencies
npm install
```

This will install dependencies for:
- Root workspace (monorepo tools)
- spoke-hire-web (main app)
- spoke-hire-cms (admin panel)

## Step 2: Database Setup

You have two options:

### Option A: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
```bash
createdb spokehire_local
```

3. Your connection string:
```
postgresql://postgres:password@localhost:5432/spokehire_local
```

### Option B: Supabase (Recommended)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for setup to complete (~2 minutes)
4. Get connection strings from: Settings → Database → Connection string
5. You need both:
   - **Transaction Pooler** (for app queries)
   - **Direct Connection** (for migrations)

## Step 3: Configure spoke-hire-web

```bash
cd spoke-hire-web
cp env.example.txt .env.local
```

Edit `.env.local` and update:

```env
# Database - Use Transaction Pooler for queries
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"

# Direct connection for migrations
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase credentials (from Settings → API)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Keep other values as defaults for now (optional services)
```

## Step 4: Configure spoke-hire-cms

```bash
cd ../spoke-hire-cms
cp env.example.txt .env.local
```

Edit `.env.local` and update:

```env
# Use the SAME database as spoke-hire-web
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Generate a secure secret
# Run: openssl rand -base64 32
PAYLOAD_SECRET="your-generated-secret-here"

# CMS URL
NEXT_PUBLIC_SERVER_URL="http://localhost:3001"

# Optional: Add Supabase credentials (same as web)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
```

**Generate PAYLOAD_SECRET:**
```bash
openssl rand -base64 32
```

Copy the output and paste it into `.env.local`.

## Step 5: Run Database Migrations

### For spoke-hire-web (Prisma)

```bash
cd spoke-hire-web
npx prisma generate
npx prisma migrate deploy
```

This creates all the tables for the main application.

### For spoke-hire-cms (PayloadCMS)

```bash
cd ../spoke-hire-cms
npm run payload migrate
```

This creates the `payload_*` prefixed tables in the same database.

## Step 6: Create Admin Users

### spoke-hire-web Admin

```bash
cd spoke-hire-web
npm run create-admin-user
```

Follow the prompts to create an admin user.

Or use Supabase Auth to sign up through the UI.

### spoke-hire-cms Admin

The CMS will prompt you to create an admin user on first access:

1. Start the CMS: `npm run dev`
2. Go to http://localhost:3001/admin
3. Follow the setup wizard

Or create via CLI:
```bash
npm run payload -- create-first-user
```

## Step 7: Start Development Servers

From the **root directory**:

```bash
# Start both apps
npm run dev
```

This runs:
- **spoke-hire-web** on http://localhost:3000
- **spoke-hire-cms** on http://localhost:3001/admin

Or start individually:

```bash
# Web app only
npm run dev:web

# CMS only
npm run dev:cms
```

## Step 8: Verify Setup

### Check spoke-hire-web

1. Open http://localhost:3000
2. You should see the homepage
3. Try signing in/up with Supabase Auth
4. Check database: Tables should exist (User, Vehicle, Deal, etc.)

### Check spoke-hire-cms

1. Open http://localhost:3001/admin
2. Log in with the admin credentials you created
3. Check Collections: Users, Media
4. Try uploading a test media file
5. Check database: `payload_*` tables should exist

## Step 9: Database Verification

Connect to your database and verify tables:

```sql
-- Check spoke-hire-web tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'payload_%';

-- Check spoke-hire-cms tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'payload_%';
```

Expected structure:
```
spoke-hire-web tables:
- User
- Vehicle
- VehicleImage
- Deal
- Make
- Model
- etc.

spoke-hire-cms tables:
- payload_users
- payload_media
- payload_migrations
- payload_preferences
- etc.
```

## Common Issues & Solutions

### Issue: npm install fails with EPERM error

**Solution**: Run with elevated permissions:
```bash
sudo npm install
```

Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors

### Issue: Database connection fails

**Solutions**:
1. Check Supabase project is active (not paused)
2. Verify connection string is correct
3. Ensure you're using Transaction Pooler for DATABASE_URL
4. Check IP is whitelisted (Supabase → Settings → Database → Connection pooling)

### Issue: Port already in use

**Solutions**:
```bash
# For spoke-hire-web
cd spoke-hire-web
PORT=3002 npm run dev

# For spoke-hire-cms
cd spoke-hire-cms
PORT=3003 npm run dev
```

### Issue: Migration fails

**Solutions**:
1. Use DIRECT_URL for migrations (not Transaction Pooler)
2. Check database permissions
3. Verify database is not read-only
4. Try resetting local database:
```bash
npx prisma migrate reset
```

### Issue: PayloadCMS admin won't load

**Solutions**:
1. Check PAYLOAD_SECRET is set
2. Verify DATABASE_URL is correct
3. Run migrations: `npm run payload migrate`
4. Clear .next folder: `rm -rf .next && npm run dev`

### Issue: TypeScript errors

**Solutions**:
```bash
# Regenerate Prisma types
cd spoke-hire-web
npx prisma generate

# Regenerate Payload types
cd spoke-hire-cms
npm run generate:types
```

## Optional Services

### Email (Loops)

For transactional emails:
1. Sign up at [loops.so](https://loops.so)
2. Get API key
3. Add to `spoke-hire-web/.env.local`:
```env
LOOPS_API_KEY="your-api-key"
```

### AI (Google Gemini)

For AI-powered content:
1. Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Add to `spoke-hire-web/.env.local`:
```env
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"
```

### Analytics

**Google Analytics 4**:
```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

**Amplitude**:
```env
NEXT_PUBLIC_AMPLITUDE_API_KEY="your-key"
AMPLITUDE_SERVER_API_KEY="your-server-key"
```

## Next Steps

1. **Customize PayloadCMS**: Add your content collections
2. **Configure Supabase Auth**: Set up OAuth providers
3. **Set up deployments**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
4. **Configure S3 storage**: See [spoke-hire-cms/STORAGE-SETUP.md](./spoke-hire-cms/STORAGE-SETUP.md)
5. **Add monitoring**: Set up error tracking (Sentry recommended)

## Development Workflow

```bash
# Daily workflow
cd SpokeHire

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Run both apps
npm run dev

# Make changes...

# Check for errors
npm run lint
npm run typecheck

# Commit and push
git add .
git commit -m "Your message"
git push
```

## Getting Help

- **spoke-hire-web docs**: `spoke-hire-web/docs/`
- **PayloadCMS docs**: https://payloadcms.com/docs
- **Supabase docs**: https://supabase.com/docs
- **Deployment guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Summary Checklist

- [ ] Node.js and npm installed
- [ ] Repository cloned
- [ ] `npm install` completed at root
- [ ] Database created (local or Supabase)
- [ ] `spoke-hire-web/.env.local` configured
- [ ] `spoke-hire-cms/.env.local` configured
- [ ] PAYLOAD_SECRET generated
- [ ] Prisma migrations run
- [ ] Payload migrations run
- [ ] Admin users created
- [ ] Both apps running locally
- [ ] Database tables verified
- [ ] Can access web app at :3000
- [ ] Can access CMS at :3001/admin

Congratulations! Your SpokeHire monorepo is now set up and ready for development. 🎉



