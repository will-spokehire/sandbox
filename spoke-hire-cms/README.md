# SpokeHire CMS

PayloadCMS instance for managing content in the SpokeHire monorepo.

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Supabase PostgreSQL database (same as spoke-hire-web)
- **For production only**: Supabase Storage S3 API enabled

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp env.example.txt .env
   # Edit .env with your Supabase credentials (same database as spoke-hire-web)
   # For local development, only DATABASE_URL and PAYLOAD_SECRET are required
   ```

3. **For local development:**
   - No storage configuration needed!
   - PayloadCMS automatically uses local filesystem storage
   - Files are stored in `./media/` directory

4. **For production deployment:**
   - Set up Supabase Storage S3 API:
     - Go to Supabase Dashboard > Storage > Settings > S3 API
     - Enable S3 API and generate credentials
     - Create a storage bucket for PayloadCMS media
     - Add credentials to `.env` file (or Vercel environment variables)

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Access admin panel:**
   - Open `http://localhost:3000/admin`
   - Create your first admin user

## Environment Variables

See `env.example.txt` for complete list.

**Required for all environments:**
- `DATABASE_URL` - Supabase PostgreSQL connection (same database as spoke-hire-web)
- `PAYLOAD_SECRET` - PayloadCMS secret key (generate with `openssl rand -base64 32`)
- `PAYLOAD_DB_SCHEMA` - Database schema name for PayloadCMS tables (default: `payload`)

**Required for production only:**
- `SUPABASE_STORAGE_ENDPOINT` - S3 endpoint URL
- `SUPABASE_STORAGE_REGION` - Storage region
- `SUPABASE_ACCESS_KEY_ID` - S3 access key
- `SUPABASE_SECRET_ACCESS_KEY` - S3 secret key
- `SUPABASE_BUCKET_NAME` - Storage bucket name

**Note:** In local development (`NODE_ENV=development`), PayloadCMS uses local filesystem storage automatically. No S3 configuration needed!

## Architecture

- **Database**: Shared Supabase PostgreSQL database with separate schema
  - PayloadCMS uses configurable schema (default: `payload`, e.g., `payload.users`, `payload.media`)
  - Schema name can be customized via `PAYLOAD_DB_SCHEMA` environment variable
  - spoke-hire-web uses `public` schema (e.g., `public.User`, `public.Vehicle`)
  - PostgreSQL schemas provide logical isolation within the same database
  - This is a standard PostgreSQL pattern and avoids Prisma conflicts
- **Storage**: Environment-based storage configuration
  - **Local Development**: Local filesystem storage (files in `./media/` directory)
  - **Production**: Supabase Storage via S3-compatible API
  - Automatically switches based on `NODE_ENV`
  - Configured in `src/payload.config.ts`
- **Deployment**: Separate Vercel project (see `vercel.json`)

## Collections

- **Users** - Authentication-enabled collection for admin access
- **Media** - Upload-enabled collection for file management

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Generate TypeScript types
npm run generate:types
```

## Deployment

Deploy to Vercel as a separate project from `spoke-hire-web`:

1. Import project in Vercel
2. Add environment variables from `.env`
3. Deploy

See `vercel.json` for deployment configuration.

## Monorepo

This project is part of the SpokeHire monorepo. Workspace commands:

```bash
# From repository root
npm run dev:cms    # Start CMS dev server
npm run build:cms  # Build CMS
```

## Documentation

- [PayloadCMS Docs](https://payloadcms.com/docs)
- [Supabase Storage S3 Compatibility](https://supabase.com/docs/guides/storage/s3/compatibility)
