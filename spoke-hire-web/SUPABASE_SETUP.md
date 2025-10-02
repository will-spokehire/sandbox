# 🔐 Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the SpokeHire admin interface.

## 📋 Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Your SpokeHire project ready

## 🚀 Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: `spokehire` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Click "Create new project"
5. Wait for the project to be provisioned (~2 minutes)

## 🔑 Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys") ⚠️ Keep this secret!

## 📝 Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # Database (use the same PostgreSQL from Supabase)
   DATABASE_URL=postgresql://postgres:your-db-password@db.xxxxx.supabase.co:5432/postgres
   ```

3. Get your DATABASE_URL from Supabase:
   - Go to **Settings** → **Database**
   - Copy the "Connection string" under "Connection pooling" (or "Direct connection")
   - Replace the password placeholder with your actual database password

## 🔧 Step 4: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Email** provider
3. Enable these options:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (Optional - disable for development)
4. Configure Email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize the "Magic Link" template if desired
   - Or use the default OTP email template

## 📧 Step 5: Configure Email OTP Settings

### A. Update Email Template for OTP

1. Go to **Authentication** → **Email Templates**
2. Select **"Magic Link"** template
3. Update the template to show OTP code:

**Subject:**
```
Your SpokeHire Admin Login Code
```

**Body (HTML):**
```html
<h2>Your Login Code</h2>
<p>Use this code to sign in to SpokeHire Admin:</p>
<h1 style="font-size: 32px; font-weight: bold; margin: 20px 0;">{{ .Token }}</h1>
<p>This code will expire in {{ .TokenExpiryDuration }} seconds.</p>
<p>If you didn't request this code, you can safely ignore this email.</p>
```

**Important:** Use `{{ .Token }}` to display the OTP code (not `{{ .ConfirmationURL }}`).

4. Click **Save**

### B. Configure OTP Settings

1. Go to **Authentication** → **Settings**
2. Under **Auth Providers** → **Email**:
   - ✅ **Enable Email provider**
   - Set **OTP expiry duration**: 3600 seconds (1 hour recommended)
   - Set **OTP length**: 6 digits (default)
3. Click **Save**

> 📝 **Note:** For a detailed, production-ready email template, see [SUPABASE_OTP_CONFIG.md](SUPABASE_OTP_CONFIG.md)

## 🌐 Step 6: Configure Site URL and Redirect URLs

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

## 🗄️ Step 7: Set Up Database Tables (Optional)

Since you're using Prisma with your own PostgreSQL database, you have two options:

### Option A: Use Your Existing Database (Recommended)
- Continue using your Prisma schema
- Supabase only handles authentication (no database tables needed)
- Link users via `supabaseId` field in your User model

### Option B: Use Supabase Database
- Update your `DATABASE_URL` to point to Supabase's PostgreSQL
- Run Prisma migrations: `npm run db:push`
- Supabase will manage both auth and database

## 🧪 Step 8: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Test the Supabase connection:
   ```bash
   # Create a test script
   node -e "
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
   supabase.auth.getSession().then(console.log);
   "
   ```

## 👤 Step 9: Create Your First Admin User

You'll need to create an admin user. We'll create a script for this in Phase 2, but for now you can:

1. Go to Supabase dashboard → **Authentication** → **Users**
2. Click "Add user" → "Create new user"
3. Enter an email address
4. Copy the user UUID
5. In your database, create a User record:
   ```sql
   INSERT INTO "User" (id, email, "supabaseId", "userType", status)
   VALUES (
     gen_random_uuid(),
     'admin@spokehire.com',
     'your-supabase-user-uuid',
     'ADMIN',
     'ACTIVE'
   );
   ```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's already in `.gitignore`
2. **Never expose service role key** - Server-side only
3. **Use Row Level Security (RLS)** - If using Supabase database
4. **Enable email confirmation** - In production
5. **Set up rate limiting** - Prevent OTP spam
6. **Monitor auth logs** - Check for suspicious activity

## 🐛 Troubleshooting

### "Invalid API key" error
- Double-check your API keys in `.env.local`
- Make sure you copied the full key (they're very long)
- Restart your dev server after changing `.env.local`

### "Failed to send email" error
- Check if Email provider is enabled in Supabase
- Verify your email templates are set up
- Check Supabase logs: **Authentication** → **Logs**

### "User already registered" error
- The email is already in Supabase Auth
- Go to **Authentication** → **Users** to manage users
- Delete the user or use a different email

### Database connection error
- Verify DATABASE_URL is correct
- Check if your IP is allowed (Supabase → Settings → Database → Connection pooling)
- Make sure password is correct

## 📚 Next Steps

Once Supabase is set up:
1. ✅ Phase 1: Supabase Client Setup (COMPLETED)
2. ⏭️ Phase 2: Create admin user script
3. ⏭️ Phase 3: Auth context & session management
4. ⏭️ Phase 4: Protected tRPC procedures
5. ⏭️ Phase 5: Admin UI components

## 🔗 Useful Links

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Email OTP Documentation](https://supabase.com/docs/guides/auth/auth-email-otp)
- [Supabase Dashboard](https://app.supabase.com)

---

Need help? Check the Supabase docs or reach out to the team!

