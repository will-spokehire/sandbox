# Supabase Setup Guide

**Purpose:** Authentication and database hosting for SpokeHire Admin Interface  
**Last Updated:** January 2025

---

## Overview

This guide covers complete Supabase setup including:
- Project creation and configuration
- Authentication setup (Email OTP)
- Row Level Security (RLS) configuration
- Database connection setup

---

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your SpokeHire project ready
- Basic understanding of PostgreSQL

---

## Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click **"New Project"**
3. Fill in:
   - **Name**: `spokehire` (or your preferred name)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"**
5. Wait for provisioning (~2 minutes)

---

## Step 2: Get API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys") ⚠️ Keep secret!

---

## Step 3: Configure Environment Variables

Create or update `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database URLs
# Use pooled connection (port 6543) for app queries
DATABASE_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true

# Use direct connection (port 5432) for migrations only
DIRECT_URL=postgresql://postgres:your-password@db.xxxxx.supabase.co:5432/postgres
```

**Important:** 
- Port **6543** = Pooled connection (use for DATABASE_URL)
- Port **5432** = Direct connection (use for DIRECT_URL/migrations)

### Get Your DATABASE_URL

1. Go to **Settings** → **Database**
2. Under **Connection pooling**, copy the connection string
3. Replace `[YOUR-PASSWORD]` with your actual database password

---

## Step 4: Enable Email Authentication

### A. Enable Email Provider

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Enable these options:
   - ✅ **Enable Email provider**
   - **Confirm email**: Disabled for development, enabled for production

### B. Configure Email OTP

1. Go to **Authentication** → **Settings**
2. Under **Auth Providers** → **Email**:
   - **OTP expiry duration**: `3600` (1 hour)
   - **OTP length**: `6` digits
3. Click **Save**

### C. Update Email Template

1. Go to **Authentication** → **Email Templates**
2. Select **"Magic Link"** template (used for OTP emails)
3. Update with this template:

**Subject:**
```
Your SpokeHire Admin Login Code
```

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">SpokeHire</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Admin Portal</p>
  </div>
  
  <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Your Login Code</h2>
    <p style="color: #6b7280; font-size: 16px;">Enter this code to sign in to your admin account:</p>
    
    <div style="background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
      <div style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #111827; font-family: 'Courier New', monospace;">
        {{ .Token }}
      </div>
    </div>
    
    <p style="color: #9ca3af; font-size: 14px; margin: 20px 0;">
      Code expires in <strong>{{ .TokenExpiryDuration }}</strong> seconds
    </p>
    
    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
      <p style="color: #9ca3af; font-size: 13px; margin: 0;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    </div>
  </div>
</body>
</html>
```

**Important:** Use `{{ .Token }}` to display the OTP code (not `{{ .ConfirmationURL }}`).

4. Click **Save**

---

## Step 5: Configure Site URL and Redirects

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: 
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:3000/auth/callback
   https://your-domain.com/auth/callback
   ```
4. Click **Save**

---

## Step 6: Row Level Security (RLS) Setup

### Understanding RLS

RLS ensures that:
- ✅ Only your server (SERVICE_ROLE key) can access the database
- ❌ Client-side code (anon key) cannot access the database directly
- ✅ All data flows through your tRPC API

### Apply RLS Configuration

**Option A: Using Supabase Dashboard (Recommended)**

1. Go to Supabase project dashboard
2. Click **"SQL Editor"** in sidebar
3. Click **"New query"**
4. Copy and paste contents of `/supabase-rls-setup.sql` from project root
5. Click **"Run"** (or press Ctrl/Cmd + Enter)

**Option B: Using Command Line**

```bash
# Use DIRECT_URL for schema changes
psql "your-direct-url-here" -f supabase-rls-setup.sql
```

### Verify RLS is Enabled

Run this in SQL Editor:

```sql
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '✅ Protected'
        ELSE '❌ Unprotected'
    END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All your tables should show `✅ Protected`.

### Understanding Supabase Keys

**ANON Key (Public/Client-Side)**
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
```
- Safe to expose in client-side code
- Limited by Row Level Security (RLS) policies
- Can only access what RLS policies allow

**SERVICE_ROLE Key (Secret/Server-Side)**
```bash
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."  # Keep secret!
```
- **NEVER expose to client-side**
- Bypasses ALL RLS policies
- Full database access
- Use only in server-side code (API routes, tRPC)

---

## Step 7: Run Database Migrations

```bash
# Push Prisma schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

---

## Step 8: Test the Setup

### Test 1: Verify Supabase Connection

```bash
npm run dev
```

Visit http://localhost:3000 - Should load without errors

### Test 2: Test Authentication

1. Go to http://localhost:3000/auth/login
2. Enter your admin email
3. Check email for 6-digit OTP code
4. Enter code at http://localhost:3000/auth/verify-otp
5. Should redirect to admin dashboard

### Test 3: Verify RLS Protection

Open browser console and try:

```javascript
// This should FAIL with permission denied
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient('your-url', 'your-anon-key');
const { data, error } = await supabase.from('Vehicle').select('*');
console.log(error); // "permission denied" - Perfect!
```

### Test 4: Verify Server-Side Works

Your tRPC endpoints should work normally:
- Visit http://localhost:3000/admin/vehicles
- Should load vehicles from database

---

## Step 9: Create Admin User

### Option A: Using Supabase Dashboard

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - **Email**: your-admin@email.com
   - **Password**: Generate or leave blank (will use OTP)
4. Click **"Create user"**

### Option B: Using Script

```bash
npm run create-admin-user
```

Follow prompts to create admin user.

---

## Troubleshooting

### Issue: Emails Not Arriving

**Check:**
1. Email provider settings in Supabase
2. Spam/junk folder
3. Email template is configured correctly
4. OTP settings are enabled

**Fix:**
- Use Supabase's SMTP or configure custom SMTP
- Check Supabase logs: **Logs** → **Auth**

### Issue: Database Connection Fails

**Check:**
1. DATABASE_URL is correct
2. Using port 6543 (pooled) for app, 5432 (direct) for migrations
3. Password is URL-encoded if it contains special characters
4. Network access from your IP

**Fix:**
- Verify connection string format
- Check Supabase dashboard for connection details
- Test with `psql` command line tool

### Issue: RLS Blocking Server-Side Code

**Check:**
1. Using SERVICE_ROLE key in server code
2. Not using ANON key for database operations
3. Supabase admin client is properly configured

**Fix:**
- Verify `createAdminClient()` uses SERVICE_ROLE key
- Check `/src/lib/supabase/server.ts` configuration

### Issue: OTP Code Shows as Link

**Check:**
1. Email template uses `{{ .Token }}` not `{{ .ConfirmationURL }}`
2. Correct template is being used (Magic Link template)

**Fix:**
- Update email template as shown in Step 4

---

## Production Checklist

Before deploying to production:

- [ ] Environment variables set in Vercel/hosting platform
- [ ] DATABASE_URL uses connection pooling (port 6543)
- [ ] DIRECT_URL uses direct connection (port 5432)
- [ ] SERVICE_ROLE key is kept secret (not in client code)
- [ ] Site URL and redirect URLs updated for production domain
- [ ] Email confirmation enabled for production
- [ ] RLS policies applied and tested
- [ ] Admin user created
- [ ] Database migrations applied
- [ ] Email templates customized with branding

---

## Security Best Practices

### Do's ✅
- Use SERVICE_ROLE key only in server-side code
- Use connection pooling (port 6543) for app queries
- Enable RLS on all tables
- Keep database passwords secure
- Use environment variables for all secrets
- Enable email confirmation in production
- Use HTTPS in production

### Don'ts ❌
- Never expose SERVICE_ROLE key to client
- Don't use ANON key for server database operations
- Don't disable RLS in production
- Don't commit secrets to version control
- Don't use weak database passwords
- Don't skip migrations when deploying

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

## Support

For issues or questions:
1. Check [Supabase Discord](https://discord.supabase.com)
2. Review [troubleshooting section](#troubleshooting) above
3. Check Supabase logs in dashboard
4. Review project documentation in `/docs`

---

**Setup Complete!** 🎉 Your Supabase is now configured for secure authentication and database access.

