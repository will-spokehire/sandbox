# RecipientStatus Enum Migration

## Manual Migration Steps

Since the shadow database has issues, apply this migration manually:

### Option 1: Via Supabase SQL Editor

1. Go to your Supabase project SQL Editor
2. Run the following SQL:

```sql
-- Create the new enum type
CREATE TYPE "RecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- Add a temporary column with the new enum type
ALTER TABLE "DealRecipient" ADD COLUMN "status_temp" "RecipientStatus";

-- Copy and convert existing values
UPDATE "DealRecipient"
SET status_temp = CASE
  WHEN status = 'pending' THEN 'PENDING'::"RecipientStatus"
  WHEN status = 'sent' THEN 'SENT'::"RecipientStatus"
  WHEN status = 'failed' THEN 'FAILED'::"RecipientStatus"
  ELSE 'PENDING'::"RecipientStatus"
END;

-- Drop the old status column
ALTER TABLE "DealRecipient" DROP COLUMN "status";

-- Rename temp column to status
ALTER TABLE "DealRecipient" RENAME COLUMN "status_temp" TO "status";

-- Set default and NOT NULL constraint
ALTER TABLE "DealRecipient" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"RecipientStatus";
ALTER TABLE "DealRecipient" ALTER COLUMN "status" SET NOT NULL;

-- Recreate index
DROP INDEX IF EXISTS "DealRecipient_status_idx";
CREATE INDEX "DealRecipient_status_idx" ON "DealRecipient"("status");
```

### Option 2: Direct Connection
```bash
psql "YOUR_DIRECT_URL" -f prisma/migrations/add_recipient_status_enum.sql
```

## After Migration

Run: `npx prisma generate`

This will update the Prisma client with the new enum type.

