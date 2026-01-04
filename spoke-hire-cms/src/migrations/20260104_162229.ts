import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."static_pages_blocks_stats_bar" DROP COLUMN "columns";
  ALTER TABLE "payload"."static_pages_blocks_stats_bar" DROP COLUMN "background_color";
  ALTER TABLE "payload"."static_blocks_blocks_stats_bar" DROP COLUMN "columns";
  ALTER TABLE "payload"."static_blocks_blocks_stats_bar" DROP COLUMN "background_color";
  DROP TYPE "payload"."enum_static_pages_blocks_stats_bar_columns";
  DROP TYPE "payload"."enum_static_pages_blocks_stats_bar_background_color";
  DROP TYPE "payload"."enum_static_blocks_blocks_stats_bar_columns";
  DROP TYPE "payload"."enum_static_blocks_blocks_stats_bar_background_color";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_static_pages_blocks_stats_bar_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "payload"."enum_static_pages_blocks_stats_bar_background_color" AS ENUM('default', 'muted', 'accent', 'primary');
  CREATE TYPE "payload"."enum_static_blocks_blocks_stats_bar_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "payload"."enum_static_blocks_blocks_stats_bar_background_color" AS ENUM('default', 'muted', 'accent', 'primary');
  ALTER TABLE "payload"."static_pages_blocks_stats_bar" ADD COLUMN "columns" "payload"."enum_static_pages_blocks_stats_bar_columns" DEFAULT '4';
  ALTER TABLE "payload"."static_pages_blocks_stats_bar" ADD COLUMN "background_color" "payload"."enum_static_pages_blocks_stats_bar_background_color" DEFAULT 'default';
  ALTER TABLE "payload"."static_blocks_blocks_stats_bar" ADD COLUMN "columns" "payload"."enum_static_blocks_blocks_stats_bar_columns" DEFAULT '4';
  ALTER TABLE "payload"."static_blocks_blocks_stats_bar" ADD COLUMN "background_color" "payload"."enum_static_blocks_blocks_stats_bar_background_color" DEFAULT 'default';`)
}
