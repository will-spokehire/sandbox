# Environment Configuration

## Setup Instructions

Since `.env.local` is gitignored, you need to create it manually:

1. Copy the template:
   ```bash
   cp env.example.txt .env.local
   ```

2. Update the following variables in `.env.local`:
   - `DATABASE_URL`: Use the same database as spoke-hire-web (local or Supabase)
   - `PAYLOAD_SECRET`: Generate a secure key with `openssl rand -base64 32`
   - `NEXT_PUBLIC_SERVER_URL`: Keep as `http://localhost:3001` for development

3. Optional: Add Supabase credentials if you plan to use S3 storage later

## Required Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (shared with spoke-hire-web)
- `PAYLOAD_SECRET`: Secret key for PayloadCMS (must be set)
- `NEXT_PUBLIC_SERVER_URL`: Base URL for the CMS

## Database Notes

PayloadCMS will create tables with the `payload_` prefix in the shared database. This ensures no conflicts with existing Prisma-managed tables from spoke-hire-web.

## Development vs Production

- **Development**: Use local PostgreSQL or Supabase with Transaction Pooler
- **Production**: Use Supabase Transaction Pooler for `DATABASE_URL` and Direct Connection for `DIRECT_URL`




