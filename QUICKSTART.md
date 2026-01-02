# SpokeHire Monorepo - Quick Start

Get up and running in 5 minutes! 🚀

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Your Supabase database connection strings ready

## Step 1: Install Dependencies (1 min)

```bash
cd SpokeHire
npm install
```

This installs everything for both apps (web + cms).

## Step 2: Configure CMS Environment (2 min)

```bash
cd spoke-hire-cms
cp env.example.txt .env.local
```

Edit `.env.local` with your values:

```env
# Use the SAME database as spoke-hire-web
DATABASE_URL="postgresql://postgres.[ref]:[pw]@aws-0-[region].pooler.supabase.com:5432/postgres?pgbouncer=true"

# Generate this: openssl rand -base64 32
PAYLOAD_SECRET="your-generated-32-char-secret"

# Keep as-is for local dev
NEXT_PUBLIC_SERVER_URL="http://localhost:3001"
```

**Generate PAYLOAD_SECRET:**
```bash
openssl rand -base64 32
```

## Step 3: Run Migrations (1 min)

```bash
npm run payload migrate
```

This creates the `payload_*` tables in your database.

## Step 4: Start Development (1 min)

From the root directory:

```bash
cd ..
npm run dev
```

This starts BOTH apps:
- **Web App**: http://localhost:3000
- **CMS Admin**: http://localhost:3001/admin

## Step 5: Create CMS Admin User

Visit http://localhost:3001/admin and follow the setup wizard to create your first admin user.

## ✅ Done!

You're all set. The CMS is ready to use.

## Common Commands

```bash
# From root directory
npm run dev          # Run both apps
npm run dev:web      # Web app only
npm run dev:cms      # CMS only

# From spoke-hire-cms
npm run payload migrate      # Run migrations
npm run generate:types       # Generate TypeScript types
```

## Need More Help?

- **Full Setup Guide**: [SETUP-GUIDE.md](./SETUP-GUIDE.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Storage Setup**: [spoke-hire-cms/STORAGE-SETUP.md](./spoke-hire-cms/STORAGE-SETUP.md)
- **CMS Docs**: [spoke-hire-cms/README.md](./spoke-hire-cms/README.md)

## Troubleshooting

**Port already in use?**
```bash
PORT=3003 npm run dev:cms
```

**Can't connect to database?**
- Verify your DATABASE_URL is correct
- Check Supabase project is not paused
- Use Transaction Pooler URL (with `?pgbouncer=true`)

**Migrations fail?**
- Ensure you have write access to the database
- Try with DIRECT_URL if using Supabase

---

**Next Steps:**
1. Customize PayloadCMS collections in `spoke-hire-cms/src/collections/`
2. Configure S3 storage for production (see STORAGE-SETUP.md)
3. Deploy to Vercel (see DEPLOYMENT.md)







