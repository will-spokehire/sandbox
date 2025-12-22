import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Add page_type column to static_pages table
  await db.execute(sql`
    ALTER TABLE "payload"."static_pages" 
      ADD COLUMN IF NOT EXISTS "page_type" varchar DEFAULT 'page';
  `)

  // Fix FAQ section subtitle column - drop and recreate as jsonb (test data, no need to preserve)
  await db.execute(sql`
    -- Drop the old subtitle column if it exists (this will remove test data)
    ALTER TABLE "payload"."static_pages_blocks_faq_section"
      DROP COLUMN IF EXISTS "subtitle";
  `)
  
  // Add subtitle column as jsonb after dropping
  await db.execute(sql`
    ALTER TABLE "payload"."static_pages_blocks_faq_section"
      ADD COLUMN IF NOT EXISTS "subtitle" jsonb;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Remove page_type column
  await db.execute(sql`
    ALTER TABLE "payload"."static_pages" 
      DROP COLUMN IF EXISTS "page_type";
  `)
}

