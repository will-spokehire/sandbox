import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."static_pages_blocks_value_stats" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_value_stats" CASCADE;
  DROP TYPE "payload"."enum_static_pages_blocks_value_stats_background_color";
  DROP TYPE "payload"."enum_static_blocks_blocks_value_stats_background_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_static_pages_blocks_value_stats_background_color" AS ENUM('default', 'muted', 'accent', 'primary');
  CREATE TYPE "payload"."enum_static_blocks_blocks_value_stats_background_color" AS ENUM('default', 'muted', 'accent', 'primary');
  CREATE TABLE "payload"."static_pages_blocks_value_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_color" "payload"."enum_static_pages_blocks_value_stats_background_color" DEFAULT 'default',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_value_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"background_color" "payload"."enum_static_blocks_blocks_value_stats_background_color" DEFAULT 'default',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  ALTER TABLE "payload"."static_pages_blocks_value_stats" ADD CONSTRAINT "static_pages_blocks_value_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_value_stats" ADD CONSTRAINT "static_blocks_blocks_value_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "static_pages_blocks_value_stats_order_idx" ON "payload"."static_pages_blocks_value_stats" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_value_stats_parent_id_idx" ON "payload"."static_pages_blocks_value_stats" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_value_stats_path_idx" ON "payload"."static_pages_blocks_value_stats" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_value_stats_order_idx" ON "payload"."static_blocks_blocks_value_stats" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_value_stats_parent_id_idx" ON "payload"."static_blocks_blocks_value_stats" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_value_stats_path_idx" ON "payload"."static_blocks_blocks_value_stats" USING btree ("_path");`)
}
