# SQL Setup Scripts

One-time setup scripts for configuring Supabase and database.

## Files

### `storage-rls-policies.sql`
**Purpose:** Configure Row Level Security policies for Supabase Storage

**What it does:**
- Uses Supabase's `storage.foldername()` function to extract vehicleId from path
- Creates ownership-based RLS policies for the `vehicle-images` bucket
- Ensures users can only upload/delete images for vehicles they own
- Allows admins to manage all vehicle images
- Enables public read access for displaying images

**How it works:**
```
Path: vehicles/{vehicleId}/{filename}
Example: vehicles/abc123/photo.jpg

storage.foldername() extracts: ['vehicles', 'abc123', 'photo.jpg']
Index [2] = vehicleId → Check ownership in database
```

**When to run:** 
- During initial Supabase setup
- After creating the `vehicle-images` storage bucket

**How to run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of this file
3. Paste and run

**Documentation:** See [Supabase Setup Guide](../../docs/setup/supabase-setup.md#step-7-storage-rls-setup-required-for-image-uploads)

---

### `seed-collections.sql`
**Purpose:** Seed default collections/tags for vehicle categorization

**What it does:**
- Inserts 12 default collections (Classic, Luxury, Sports, Electric, etc.)
- Each collection has a name, slug, description, and color code
- Uses upsert logic (ON CONFLICT DO UPDATE) for safe re-running

**When to run:**
- After initial database setup
- When you want to refresh collections in local development

**How to run locally:**
```bash
# Using the helper script (recommended)
./scripts/seed-collections-local.sh

# Or manually
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -f sql/setup/seed-collections.sql
```

**Collections included:**
- Classic, Vintage (heritage vehicles)
- Luxury, Premium (high-end vehicles)
- Sports, Performance, Exotic (high-performance vehicles)
- SUV, Convertible, Off-Road (vehicle types)
- Electric (electric/hybrid vehicles)
- Family (family-friendly vehicles)

---

## Notes

- These are **one-time setup scripts**, not migrations
- They configure Supabase-specific features (Storage RLS)
- Seed scripts can be run multiple times safely (upsert logic)
- Prisma migrations are handled separately in `prisma/migrations/`
- Always test in development before running in production

