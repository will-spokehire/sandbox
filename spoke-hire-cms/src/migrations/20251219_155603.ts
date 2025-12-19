import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop placement column
    ALTER TABLE "payload"."cta_blocks" DROP COLUMN IF EXISTS "placement";
    
    -- Drop button_text and button_link columns
    ALTER TABLE "payload"."cta_blocks" DROP COLUMN IF EXISTS "button_text";
    ALTER TABLE "payload"."cta_blocks" DROP COLUMN IF EXISTS "button_link";
    
    -- Add actions JSONB column
    ALTER TABLE "payload"."cta_blocks" ADD COLUMN IF NOT EXISTS "actions" jsonb;
    
    -- Drop the placement enum type if it exists and is not used elsewhere
    DROP TYPE IF EXISTS "payload"."enum_cta_blocks_placement";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Recreate placement enum type
    CREATE TYPE "payload"."enum_cta_blocks_placement" AS ENUM('homepage', 'sidebar', 'footer');
    
    -- Add back placement column
    ALTER TABLE "payload"."cta_blocks" ADD COLUMN IF NOT EXISTS "placement" "payload"."enum_cta_blocks_placement" DEFAULT 'homepage' NOT NULL;
    
    -- Add back button_text and button_link columns
    ALTER TABLE "payload"."cta_blocks" ADD COLUMN IF NOT EXISTS "button_text" varchar;
    ALTER TABLE "payload"."cta_blocks" ADD COLUMN IF NOT EXISTS "button_link" varchar;
    
    -- Drop actions column
    ALTER TABLE "payload"."cta_blocks" DROP COLUMN IF EXISTS "actions";
  `)
}

