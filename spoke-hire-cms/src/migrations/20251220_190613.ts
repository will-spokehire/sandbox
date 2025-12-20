import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Drop value column from stats table
    ALTER TABLE "payload"."stats" 
      DROP COLUMN IF EXISTS "value";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Re-add value column (nullable)
    ALTER TABLE "payload"."stats" 
      ADD COLUMN IF NOT EXISTS "value" varchar;
  `)
}

