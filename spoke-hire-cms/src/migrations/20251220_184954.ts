import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create icons table
    CREATE TABLE IF NOT EXISTS "payload"."icons" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
    
    -- Create icons_svg relation table (for upload field)
    CREATE TABLE IF NOT EXISTS "payload"."icons_rels" (
      "id" serial PRIMARY KEY NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL,
      "path" varchar NOT NULL,
      "media_id" integer
    );
    
    -- Add foreign key for icons_rels to media
    ALTER TABLE "payload"."icons_rels" 
      ADD CONSTRAINT "icons_rels_media_fk" 
      FOREIGN KEY ("media_id") 
      REFERENCES "payload"."media"("id") 
      ON DELETE set null ON UPDATE no action;
    
    -- Add foreign key for icons_rels to icons
    ALTER TABLE "payload"."icons_rels" 
      ADD CONSTRAINT "icons_rels_parent_fk" 
      FOREIGN KEY ("parent_id") 
      REFERENCES "payload"."icons"("id") 
      ON DELETE cascade ON UPDATE no action;
    
    -- Create indexes for icons
    CREATE INDEX IF NOT EXISTS "icons_updated_at_idx" ON "payload"."icons" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "icons_created_at_idx" ON "payload"."icons" USING btree ("created_at");
    CREATE UNIQUE INDEX IF NOT EXISTS "icons_name_idx" ON "payload"."icons" USING btree ("name");
    CREATE INDEX IF NOT EXISTS "icons_rels_parent_id_idx" ON "payload"."icons_rels" USING btree ("parent_id");
    CREATE INDEX IF NOT EXISTS "icons_rels_media_id_idx" ON "payload"."icons_rels" USING btree ("media_id");
    
    -- Change stats.icon from varchar to integer (for relation)
    -- First, drop the old column if it exists
    ALTER TABLE "payload"."stats" DROP COLUMN IF EXISTS "icon";
    
    -- Add new icon_id column for relation
    ALTER TABLE "payload"."stats" ADD COLUMN IF NOT EXISTS "icon_id" integer;
    
    -- Add foreign key constraint
    ALTER TABLE "payload"."stats" 
      ADD CONSTRAINT "stats_icon_id_icons_id_fk" 
      FOREIGN KEY ("icon_id") 
      REFERENCES "payload"."icons"("id") 
      ON DELETE set null ON UPDATE no action;
    
    -- Create index for stats.icon_id
    CREATE INDEX IF NOT EXISTS "stats_icon_id_idx" ON "payload"."stats" USING btree ("icon_id");
    
    -- Change value-props.icon from varchar to integer (for relation)
    -- First, drop the old column if it exists
    ALTER TABLE "payload"."value_props" DROP COLUMN IF EXISTS "icon";
    
    -- Add new icon_id column for relation
    ALTER TABLE "payload"."value_props" ADD COLUMN IF NOT EXISTS "icon_id" integer;
    
    -- Add foreign key constraint
    ALTER TABLE "payload"."value_props" 
      ADD CONSTRAINT "value_props_icon_id_icons_id_fk" 
      FOREIGN KEY ("icon_id") 
      REFERENCES "payload"."icons"("id") 
      ON DELETE set null ON UPDATE no action;
    
    -- Create index for value_props.icon_id
    CREATE INDEX IF NOT EXISTS "value_props_icon_id_idx" ON "payload"."value_props" USING btree ("icon_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Revert value-props changes
    ALTER TABLE "payload"."value_props" DROP CONSTRAINT IF EXISTS "value_props_icon_id_icons_id_fk";
    DROP INDEX IF EXISTS "payload"."value_props_icon_id_idx";
    ALTER TABLE "payload"."value_props" DROP COLUMN IF EXISTS "icon_id";
    ALTER TABLE "payload"."value_props" ADD COLUMN IF NOT EXISTS "icon" varchar;
    
    -- Revert stats changes
    ALTER TABLE "payload"."stats" DROP CONSTRAINT IF EXISTS "stats_icon_id_icons_id_fk";
    DROP INDEX IF EXISTS "payload"."stats_icon_id_idx";
    ALTER TABLE "payload"."stats" DROP COLUMN IF EXISTS "icon_id";
    ALTER TABLE "payload"."stats" ADD COLUMN IF NOT EXISTS "icon" varchar;
    
    -- Drop icons table and relations
    DROP INDEX IF EXISTS "payload"."icons_rels_media_id_idx";
    DROP INDEX IF EXISTS "payload"."icons_rels_parent_id_idx";
    DROP INDEX IF EXISTS "payload"."icons_name_idx";
    DROP INDEX IF EXISTS "payload"."icons_created_at_idx";
    DROP INDEX IF EXISTS "payload"."icons_updated_at_idx";
    ALTER TABLE "payload"."icons_rels" DROP CONSTRAINT IF EXISTS "icons_rels_parent_fk";
    ALTER TABLE "payload"."icons_rels" DROP CONSTRAINT IF EXISTS "icons_rels_media_fk";
    DROP TABLE IF EXISTS "payload"."icons_rels";
    DROP TABLE IF EXISTS "payload"."icons";
  `)
}

