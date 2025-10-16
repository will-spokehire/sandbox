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

## Notes

- These are **one-time setup scripts**, not migrations
- They configure Supabase-specific features (Storage RLS)
- Prisma migrations are handled separately in `prisma/migrations/`
- Always test in development before running in production

