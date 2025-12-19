# Deployment Guide - SpokeHire Monorepo

## Architecture Overview

The SpokeHire project consists of two applications deployed as separate Vercel projects:

1. **spoke-hire-web** - Main web application (Next.js)
2. **spoke-hire-cms** - PayloadCMS admin panel (Next.js)

Both applications share the same Supabase PostgreSQL database.

## Vercel Project Setup

### 1. Create Two Vercel Projects

You need to create **two separate Vercel projects** from the same GitHub repository:

#### Project 1: spoke-hire-web (Main App)

1. Go to Vercel Dashboard → New Project
2. Import your GitHub repository
3. Configure:
   - **Project Name**: `spoke-hire-web` (or your preferred name)
   - **Framework**: Next.js
   - **Root Directory**: `spoke-hire-web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

#### Project 2: spoke-hire-cms (Admin Panel)

1. Go to Vercel Dashboard → New Project
2. Import the **same** GitHub repository
3. Configure:
   - **Project Name**: `spoke-hire-cms` (or your preferred name)
   - **Framework**: Next.js
   - **Root Directory**: `spoke-hire-cms`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 2. Configure Environment Variables

#### spoke-hire-web Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Application
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NODE_ENV="production"

# Email (Loops)
LOOPS_API_KEY="your-loops-api-key"
LOOPS_VEHICLE_PUBLISHED_ID="vehicle-published"
LOOPS_VEHICLE_DECLINED_ID="vehicle-declined"
LOOPS_VEHICLE_IN_REVIEW_ID="vehicle-in-review"
LOOPS_ENQUIRY_ADMIN_ID="enquiry-admin-notification"
LOOPS_ENQUIRY_USER_ID="enquiry-user-confirmation"
ADMIN_NOTIFICATION_EMAIL="admin@spokehire.com"

# AI
GOOGLE_GENERATIVE_AI_API_KEY="your-google-ai-key"

# OAuth
GOOGLE_OAUTH_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_OAUTH_CLIENT_SECRET="your-client-secret"

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_AMPLITUDE_API_KEY="your-amplitude-key"
AMPLITUDE_SERVER_API_KEY="your-amplitude-server-key"

# Skip validation for build
SKIP_ENV_VALIDATION="true"
```

#### spoke-hire-cms Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database (shared with web)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# PayloadCMS
PAYLOAD_SECRET="your-secure-payload-secret-32chars"
NEXT_PUBLIC_SERVER_URL="https://cms.your-domain.com"

# Supabase (optional, for future S3 storage)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Environment
NODE_ENV="production"
```

### 3. Domain Configuration

#### Main App (spoke-hire-web)
- Primary domain: `spokehire.com`
- Aliases: `www.spokehire.com`

#### CMS (spoke-hire-cms)
- Subdomain: `cms.spokehire.com` or `admin.spokehire.com`

Configure domains in Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Database Migrations

### spoke-hire-web (Prisma)

Migrations run automatically during build using the `postinstall` script in package.json:

```json
"postinstall": "prisma generate"
```

For manual migrations:
```bash
npm run db:migrate -w spoke-hire-web
```

### spoke-hire-cms (PayloadCMS)

PayloadCMS runs migrations automatically on startup. You can also run them manually:

```bash
npm run payload migrate -w spoke-hire-cms
```

## Deployment Workflow

### Automatic Deployments

Both projects are configured for automatic deployment:

1. **Production**: Push to `main` branch → Deploys both projects
2. **Preview**: Push to any branch → Creates preview deployments

### Manual Deployment

From Vercel Dashboard:
1. Go to Deployments
2. Click "Redeploy"
3. Select commit to deploy

Or using Vercel CLI:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy web app
cd spoke-hire-web
vercel --prod

# Deploy CMS
cd spoke-hire-cms
vercel --prod
```

## Build Configuration

### spoke-hire-web

The `vercel.json` includes:
- Build command skips env validation (`SKIP_ENV_VALIDATION=true`)
- Uses Next.js framework detection
- Auto-generates `.next` output

### spoke-hire-cms

The `vercel.json` includes:
- Standard Next.js build
- Environment variables for Payload configuration
- Regions set to `iad1` (US East)

## Database Table Structure

Both applications share the same database but use different table prefixes:

```
Supabase PostgreSQL Database
├── spoke-hire-web tables
│   ├── User
│   ├── Vehicle
│   ├── Deal
│   ├── VehicleImage
│   └── ... (Prisma-managed)
└── spoke-hire-cms tables
    ├── payload_users
    ├── payload_media
    ├── payload_migrations
    └── ... (Payload-managed)
```

## Monitoring & Logs

### Vercel Logs
- View in Vercel Dashboard → Functions → Logs
- Real-time logs during deployment
- Runtime logs for debugging

### Supabase Database Logs
- View in Supabase Dashboard → Database → Logs
- Query performance
- Connection monitoring

## Troubleshooting

### Build Failures

**spoke-hire-web:**
- Check TypeScript errors: `npm run typecheck`
- Check linting: `npm run lint`
- Verify env vars are set in Vercel

**spoke-hire-cms:**
- Verify `PAYLOAD_SECRET` is set
- Check database connection string
- Ensure migrations have run

### Database Connection Issues

1. Verify connection strings are correct
2. Use Transaction Pooler (`pgbouncer=true`) for `DATABASE_URL`
3. Use Direct Connection for `DIRECT_URL` (migrations)
4. Check Supabase project is not paused

### Domain Issues

1. Verify DNS records are correct
2. Wait for DNS propagation (up to 48 hours)
3. Check SSL certificate provisioning in Vercel

## Security Checklist

- [ ] All sensitive env vars are set in Vercel (not in code)
- [ ] `PAYLOAD_SECRET` is strong (32+ characters)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret
- [ ] Database passwords are rotated regularly
- [ ] CORS is configured correctly in Supabase
- [ ] API rate limiting is enabled
- [ ] Admin emails are configured for notifications

## Updating Dependencies

From the monorepo root:

```bash
# Update all workspaces
npm update

# Update specific workspace
npm update -w spoke-hire-web
npm update -w spoke-hire-cms

# Update and test locally before deploying
npm run build
```

## Rollback Strategy

If deployment fails:

1. **Vercel UI**: Go to Deployments → Select previous working deployment → Promote to Production
2. **Git**: Revert commit and push
3. **Database**: Use Supabase point-in-time recovery if needed

## Production Checklist

Before going live:

- [ ] Environment variables configured in both Vercel projects
- [ ] Custom domains configured and verified
- [ ] Database migrations successful
- [ ] SSL certificates active
- [ ] Admin user created in PayloadCMS
- [ ] Backup strategy in place
- [ ] Monitoring and alerts configured
- [ ] Email templates tested (Loops)
- [ ] Analytics tracking verified (GA4, Amplitude)
- [ ] Error tracking set up (Sentry recommended)

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Supabase: [supabase.com/support](https://supabase.com/support)
- PayloadCMS: [payloadcms.com/docs](https://payloadcms.com/docs)




