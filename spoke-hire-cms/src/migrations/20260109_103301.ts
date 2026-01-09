import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_static_pages_blocks_rich_text_content_header_type" AS ENUM('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
  CREATE TYPE "payload"."enum_static_blocks_blocks_rich_text_content_header_type" AS ENUM('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
  ALTER TABLE "payload"."hero_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."static_pages_blocks_image_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."static_pages_blocks_image_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."static_pages_blocks_two_column_content" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."static_blocks_blocks_image_gallery_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."static_blocks_blocks_image_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."static_blocks_blocks_two_column_content" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."hero_slides" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_image_gallery_images" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_image_gallery" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_two_column_content" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_image_gallery_images" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_image_gallery" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_two_column_content" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hero_slides_fk";
  
  ALTER TABLE "payload"."static_pages_blocks_spacer" ALTER COLUMN "height" SET DATA TYPE text;
  ALTER TABLE "payload"."static_pages_blocks_spacer" ALTER COLUMN "height" SET DEFAULT 'medium'::text;
  DROP TYPE "payload"."enum_static_pages_blocks_spacer_height";
  CREATE TYPE "payload"."enum_static_pages_blocks_spacer_height" AS ENUM('small', 'medium', 'large');
  ALTER TABLE "payload"."static_pages_blocks_spacer" ALTER COLUMN "height" SET DEFAULT 'medium'::"payload"."enum_static_pages_blocks_spacer_height";
  ALTER TABLE "payload"."static_pages_blocks_spacer" ALTER COLUMN "height" SET DATA TYPE "payload"."enum_static_pages_blocks_spacer_height" USING "height"::"payload"."enum_static_pages_blocks_spacer_height";
  ALTER TABLE "payload"."static_blocks_blocks_spacer" ALTER COLUMN "height" SET DATA TYPE text;
  ALTER TABLE "payload"."static_blocks_blocks_spacer" ALTER COLUMN "height" SET DEFAULT 'medium'::text;
  DROP TYPE "payload"."enum_static_blocks_blocks_spacer_height";
  CREATE TYPE "payload"."enum_static_blocks_blocks_spacer_height" AS ENUM('small', 'medium', 'large');
  ALTER TABLE "payload"."static_blocks_blocks_spacer" ALTER COLUMN "height" SET DEFAULT 'medium'::"payload"."enum_static_blocks_blocks_spacer_height";
  ALTER TABLE "payload"."static_blocks_blocks_spacer" ALTER COLUMN "height" SET DATA TYPE "payload"."enum_static_blocks_blocks_spacer_height" USING "height"::"payload"."enum_static_blocks_blocks_spacer_height";
  DROP INDEX "payload"."payload_locked_documents_rels_hero_slides_id_idx";
  ALTER TABLE "payload"."static_pages_blocks_rich_text_content" ADD COLUMN "header" varchar;
  ALTER TABLE "payload"."static_pages_blocks_rich_text_content" ADD COLUMN "header_type" "payload"."enum_static_pages_blocks_rich_text_content_header_type" DEFAULT 'h2';
  ALTER TABLE "payload"."static_blocks_blocks_rich_text_content" ADD COLUMN "header" varchar;
  ALTER TABLE "payload"."static_blocks_blocks_rich_text_content" ADD COLUMN "header_type" "payload"."enum_static_blocks_blocks_rich_text_content_header_type" DEFAULT 'h2';
  ALTER TABLE "payload"."cta_blocks" DROP COLUMN "background_style";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "hero_slides_id";
  DROP TYPE "payload"."enum_hero_slides_status";
  DROP TYPE "payload"."enum_cta_blocks_background_style";
  DROP TYPE "payload"."enum_static_pages_blocks_image_gallery_display_style";
  DROP TYPE "payload"."enum_static_pages_blocks_image_gallery_columns";
  DROP TYPE "payload"."enum_static_pages_blocks_two_column_content_column_ratio";
  DROP TYPE "payload"."enum_static_pages_blocks_two_column_content_vertical_alignment";
  DROP TYPE "payload"."enum_static_blocks_blocks_image_gallery_display_style";
  DROP TYPE "payload"."enum_static_blocks_blocks_image_gallery_columns";
  DROP TYPE "payload"."enum_static_blocks_blocks_two_column_content_column_ratio";
  DROP TYPE "payload"."enum_static_blocks_blocks_two_column_content_vertical_alignment";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_hero_slides_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_cta_blocks_background_style" AS ENUM('primary', 'secondary', 'accent');
  CREATE TYPE "payload"."enum_static_pages_blocks_image_gallery_display_style" AS ENUM('grid', 'masonry', 'carousel', 'lightbox-grid');
  CREATE TYPE "payload"."enum_static_pages_blocks_image_gallery_columns" AS ENUM('2', '3', '4', '5');
  CREATE TYPE "payload"."enum_static_pages_blocks_two_column_content_column_ratio" AS ENUM('50-50', '60-40', '40-60', '70-30', '30-70');
  CREATE TYPE "payload"."enum_static_pages_blocks_two_column_content_vertical_alignment" AS ENUM('top', 'center', 'bottom');
  CREATE TYPE "payload"."enum_static_blocks_blocks_image_gallery_display_style" AS ENUM('grid', 'masonry', 'carousel', 'lightbox-grid');
  CREATE TYPE "payload"."enum_static_blocks_blocks_image_gallery_columns" AS ENUM('2', '3', '4', '5');
  CREATE TYPE "payload"."enum_static_blocks_blocks_two_column_content_column_ratio" AS ENUM('50-50', '60-40', '40-60', '70-30', '30-70');
  CREATE TYPE "payload"."enum_static_blocks_blocks_two_column_content_vertical_alignment" AS ENUM('top', 'center', 'bottom');
  ALTER TYPE "payload"."enum_static_pages_blocks_spacer_height" ADD VALUE 'extra-large';
  ALTER TYPE "payload"."enum_static_blocks_blocks_spacer_height" ADD VALUE 'extra-large';
  CREATE TABLE "payload"."hero_slides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"cta_text" varchar,
  	"cta_link" varchar,
  	"status" "payload"."enum_hero_slides_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."static_pages_blocks_image_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"link" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_image_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"display_style" "payload"."enum_static_pages_blocks_image_gallery_display_style" DEFAULT 'grid',
  	"columns" "payload"."enum_static_pages_blocks_image_gallery_columns" DEFAULT '3',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_two_column_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"left_column" jsonb NOT NULL,
  	"right_column" jsonb NOT NULL,
  	"column_ratio" "payload"."enum_static_pages_blocks_two_column_content_column_ratio" DEFAULT '50-50',
  	"reverse_on_mobile" boolean DEFAULT true,
  	"vertical_alignment" "payload"."enum_static_pages_blocks_two_column_content_vertical_alignment" DEFAULT 'top',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_image_gallery_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar,
  	"link" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_image_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"display_style" "payload"."enum_static_blocks_blocks_image_gallery_display_style" DEFAULT 'grid',
  	"columns" "payload"."enum_static_blocks_blocks_image_gallery_columns" DEFAULT '3',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_two_column_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"left_column" jsonb NOT NULL,
  	"right_column" jsonb NOT NULL,
  	"column_ratio" "payload"."enum_static_blocks_blocks_two_column_content_column_ratio" DEFAULT '50-50',
  	"reverse_on_mobile" boolean DEFAULT true,
  	"vertical_alignment" "payload"."enum_static_blocks_blocks_two_column_content_vertical_alignment" DEFAULT 'top',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  ALTER TABLE "payload"."cta_blocks" ADD COLUMN "background_style" "payload"."enum_cta_blocks_background_style" DEFAULT 'primary' NOT NULL;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "hero_slides_id" integer;
  ALTER TABLE "payload"."hero_slides" ADD CONSTRAINT "hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_image_gallery_images" ADD CONSTRAINT "static_pages_blocks_image_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_image_gallery_images" ADD CONSTRAINT "static_pages_blocks_image_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages_blocks_image_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_image_gallery" ADD CONSTRAINT "static_pages_blocks_image_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_two_column_content" ADD CONSTRAINT "static_pages_blocks_two_column_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_image_gallery_images" ADD CONSTRAINT "static_blocks_blocks_image_gallery_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_image_gallery_images" ADD CONSTRAINT "static_blocks_blocks_image_gallery_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks_blocks_image_gallery"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_image_gallery" ADD CONSTRAINT "static_blocks_blocks_image_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_two_column_content" ADD CONSTRAINT "static_blocks_blocks_two_column_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "hero_slides_image_idx" ON "payload"."hero_slides" USING btree ("image_id");
  CREATE INDEX "hero_slides_updated_at_idx" ON "payload"."hero_slides" USING btree ("updated_at");
  CREATE INDEX "hero_slides_created_at_idx" ON "payload"."hero_slides" USING btree ("created_at");
  CREATE INDEX "static_pages_blocks_image_gallery_images_order_idx" ON "payload"."static_pages_blocks_image_gallery_images" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_image_gallery_images_parent_id_idx" ON "payload"."static_pages_blocks_image_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_image_gallery_images_image_idx" ON "payload"."static_pages_blocks_image_gallery_images" USING btree ("image_id");
  CREATE INDEX "static_pages_blocks_image_gallery_order_idx" ON "payload"."static_pages_blocks_image_gallery" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_image_gallery_parent_id_idx" ON "payload"."static_pages_blocks_image_gallery" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_image_gallery_path_idx" ON "payload"."static_pages_blocks_image_gallery" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_two_column_content_order_idx" ON "payload"."static_pages_blocks_two_column_content" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_two_column_content_parent_id_idx" ON "payload"."static_pages_blocks_two_column_content" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_two_column_content_path_idx" ON "payload"."static_pages_blocks_two_column_content" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_image_gallery_images_order_idx" ON "payload"."static_blocks_blocks_image_gallery_images" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_image_gallery_images_parent_id_idx" ON "payload"."static_blocks_blocks_image_gallery_images" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_image_gallery_images_image_idx" ON "payload"."static_blocks_blocks_image_gallery_images" USING btree ("image_id");
  CREATE INDEX "static_blocks_blocks_image_gallery_order_idx" ON "payload"."static_blocks_blocks_image_gallery" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_image_gallery_parent_id_idx" ON "payload"."static_blocks_blocks_image_gallery" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_image_gallery_path_idx" ON "payload"."static_blocks_blocks_image_gallery" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_two_column_content_order_idx" ON "payload"."static_blocks_blocks_two_column_content" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_two_column_content_parent_id_idx" ON "payload"."static_blocks_blocks_two_column_content" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_two_column_content_path_idx" ON "payload"."static_blocks_blocks_two_column_content" USING btree ("_path");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hero_slides_fk" FOREIGN KEY ("hero_slides_id") REFERENCES "payload"."hero_slides"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_hero_slides_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("hero_slides_id");
  ALTER TABLE "payload"."static_pages_blocks_rich_text_content" DROP COLUMN "header";
  ALTER TABLE "payload"."static_pages_blocks_rich_text_content" DROP COLUMN "header_type";
  ALTER TABLE "payload"."static_blocks_blocks_rich_text_content" DROP COLUMN "header";
  ALTER TABLE "payload"."static_blocks_blocks_rich_text_content" DROP COLUMN "header_type";
  DROP TYPE "payload"."enum_static_pages_blocks_rich_text_content_header_type";
  DROP TYPE "payload"."enum_static_blocks_blocks_rich_text_content_header_type";`)
}
