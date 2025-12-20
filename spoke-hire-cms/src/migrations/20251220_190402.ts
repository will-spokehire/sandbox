import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Make value column nullable in stats table
    ALTER TABLE "payload"."stats" 
      ALTER COLUMN "value" DROP NOT NULL;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Make value column required again (set existing nulls to empty string first)
    UPDATE "payload"."stats" 
      SET "value" = '' 
      WHERE "value" IS NULL;
    
    ALTER TABLE "payload"."stats" 
      ALTER COLUMN "value" SET NOT NULL;
  `)
}

