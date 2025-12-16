import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_hero_slides_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_stats_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_value_props_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_featured_vehicles_config_selection_type" AS ENUM('manual', 'newest', 'price-range');
  CREATE TYPE "payload"."enum_cta_blocks_background_style" AS ENUM('primary', 'secondary', 'accent');
  CREATE TYPE "payload"."enum_cta_blocks_placement" AS ENUM('homepage', 'sidebar', 'footer');
  CREATE TYPE "payload"."enum_cta_blocks_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_testimonials_category" AS ENUM('vehicle-owner', 'renter', 'wedding', 'film');
  CREATE TYPE "payload"."enum_testimonials_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_faqs_category" AS ENUM('general', 'vehicle-owners', 'renters', 'pricing', 'technical');
  CREATE TYPE "payload"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_navigation_footer_columns_type" AS ENUM('links', 'contact');
  CREATE TYPE "payload"."enum_navigation_social_links_platform" AS ENUM('facebook', 'instagram', 'twitter', 'linkedin');
  CREATE TABLE "payload"."hero_slides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"heading" varchar NOT NULL,
  	"subheading" varchar,
  	"cta_text" varchar,
  	"cta_link" varchar,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"status" "payload"."enum_hero_slides_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"icon" varchar,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"status" "payload"."enum_stats_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."value_props" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"icon" varchar,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"status" "payload"."enum_value_props_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."featured_vehicles_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"selection_type" "payload"."enum_featured_vehicles_config_selection_type" DEFAULT 'newest' NOT NULL,
  	"count" numeric DEFAULT 6 NOT NULL,
  	"criteria" jsonb,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."cta_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"button_text" varchar NOT NULL,
  	"button_link" varchar NOT NULL,
  	"background_style" "payload"."enum_cta_blocks_background_style" DEFAULT 'primary' NOT NULL,
  	"placement" "payload"."enum_cta_blocks_placement" DEFAULT 'homepage' NOT NULL,
  	"status" "payload"."enum_cta_blocks_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author" varchar NOT NULL,
  	"role" varchar,
  	"rating" numeric,
  	"image_id" integer,
  	"category" "payload"."enum_testimonials_category",
  	"featured" boolean DEFAULT false,
  	"order" numeric DEFAULT 0 NOT NULL,
  	"status" "payload"."enum_testimonials_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"category" "payload"."enum_faqs_category",
  	"order" numeric DEFAULT 0 NOT NULL,
  	"featured" boolean DEFAULT false,
  	"status" "payload"."enum_faqs_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."navigation_main_menu_children" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."navigation_main_menu" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link" varchar NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "payload"."navigation_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."navigation_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"type" "payload"."enum_navigation_footer_columns_type",
  	"contact_info_address_label" varchar DEFAULT 'Address',
  	"contact_info_address_value" varchar,
  	"contact_info_email_label" varchar DEFAULT 'Contact',
  	"contact_info_email_value" varchar
  );
  
  CREATE TABLE "payload"."navigation_social_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"platform" "payload"."enum_navigation_social_links_platform" NOT NULL,
  	"url" varchar NOT NULL,
  	"icon" varchar
  );
  
  CREATE TABLE "payload"."navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"footer_settings_copyright_text" varchar DEFAULT '© 2025 Spoke Hire Ltd. All rights reserved.',
  	"footer_settings_privacy_policy_url" varchar DEFAULT '/privacy-policy',
  	"footer_settings_terms_of_service_url" varchar DEFAULT '/terms-of-service',
  	"footer_settings_show_large_logo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_name" varchar DEFAULT 'SpokeHire' NOT NULL,
  	"tagline" varchar,
  	"logo_id" integer,
  	"favicon_id" integer,
  	"seo_defaults_default_meta_description" varchar,
  	"seo_defaults_default_og_image_id" integer,
  	"analytics_google_analytics_id" varchar,
  	"copyright_text" varchar DEFAULT '© 2025 Spoke Hire Ltd',
  	"contact_info_email" varchar,
  	"contact_info_phone" varchar,
  	"contact_info_address" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "hero_slides_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "stats_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "value_props_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "featured_vehicles_config_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "cta_blocks_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "testimonials_id" integer;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD COLUMN "faqs_id" integer;
  ALTER TABLE "payload"."hero_slides" ADD CONSTRAINT "hero_slides_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."testimonials" ADD CONSTRAINT "testimonials_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu_children" ADD CONSTRAINT "navigation_main_menu_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_footer_columns" ADD CONSTRAINT "navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_social_links" ADD CONSTRAINT "navigation_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_seo_defaults_default_og_image_id_media_id_fk" FOREIGN KEY ("seo_defaults_default_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "hero_slides_image_idx" ON "payload"."hero_slides" USING btree ("image_id");
  CREATE INDEX "hero_slides_updated_at_idx" ON "payload"."hero_slides" USING btree ("updated_at");
  CREATE INDEX "hero_slides_created_at_idx" ON "payload"."hero_slides" USING btree ("created_at");
  CREATE INDEX "stats_updated_at_idx" ON "payload"."stats" USING btree ("updated_at");
  CREATE INDEX "stats_created_at_idx" ON "payload"."stats" USING btree ("created_at");
  CREATE INDEX "value_props_updated_at_idx" ON "payload"."value_props" USING btree ("updated_at");
  CREATE INDEX "value_props_created_at_idx" ON "payload"."value_props" USING btree ("created_at");
  CREATE INDEX "featured_vehicles_config_updated_at_idx" ON "payload"."featured_vehicles_config" USING btree ("updated_at");
  CREATE INDEX "featured_vehicles_config_created_at_idx" ON "payload"."featured_vehicles_config" USING btree ("created_at");
  CREATE INDEX "cta_blocks_updated_at_idx" ON "payload"."cta_blocks" USING btree ("updated_at");
  CREATE INDEX "cta_blocks_created_at_idx" ON "payload"."cta_blocks" USING btree ("created_at");
  CREATE INDEX "testimonials_image_idx" ON "payload"."testimonials" USING btree ("image_id");
  CREATE INDEX "testimonials_updated_at_idx" ON "payload"."testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "payload"."testimonials" USING btree ("created_at");
  CREATE INDEX "faqs_updated_at_idx" ON "payload"."faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "payload"."faqs" USING btree ("created_at");
  CREATE INDEX "navigation_main_menu_children_order_idx" ON "payload"."navigation_main_menu_children" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_children_parent_id_idx" ON "payload"."navigation_main_menu_children" USING btree ("_parent_id");
  CREATE INDEX "navigation_main_menu_order_idx" ON "payload"."navigation_main_menu" USING btree ("_order");
  CREATE INDEX "navigation_main_menu_parent_id_idx" ON "payload"."navigation_main_menu" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_links_order_idx" ON "payload"."navigation_footer_columns_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_links_parent_id_idx" ON "payload"."navigation_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_footer_columns_order_idx" ON "payload"."navigation_footer_columns" USING btree ("_order");
  CREATE INDEX "navigation_footer_columns_parent_id_idx" ON "payload"."navigation_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "navigation_social_links_order_idx" ON "payload"."navigation_social_links" USING btree ("_order");
  CREATE INDEX "navigation_social_links_parent_id_idx" ON "payload"."navigation_social_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_logo_idx" ON "payload"."site_settings" USING btree ("logo_id");
  CREATE INDEX "site_settings_favicon_idx" ON "payload"."site_settings" USING btree ("favicon_id");
  CREATE INDEX "site_settings_seo_defaults_seo_defaults_default_og_image_idx" ON "payload"."site_settings" USING btree ("seo_defaults_default_og_image_id");
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hero_slides_fk" FOREIGN KEY ("hero_slides_id") REFERENCES "payload"."hero_slides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "payload"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_value_props_fk" FOREIGN KEY ("value_props_id") REFERENCES "payload"."value_props"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_featured_vehicles_config_fk" FOREIGN KEY ("featured_vehicles_config_id") REFERENCES "payload"."featured_vehicles_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cta_blocks_fk" FOREIGN KEY ("cta_blocks_id") REFERENCES "payload"."cta_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "payload"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "payload"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_hero_slides_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("hero_slides_id");
  CREATE INDEX "payload_locked_documents_rels_stats_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("stats_id");
  CREATE INDEX "payload_locked_documents_rels_value_props_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("value_props_id");
  CREATE INDEX "payload_locked_documents_rels_featured_vehicles_config_i_idx" ON "payload"."payload_locked_documents_rels" USING btree ("featured_vehicles_config_id");
  CREATE INDEX "payload_locked_documents_rels_cta_blocks_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("cta_blocks_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("faqs_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."hero_slides" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."value_props" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."featured_vehicles_config" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."cta_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."testimonials" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."navigation_main_menu_children" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."navigation_main_menu" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."navigation_footer_columns_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."navigation_footer_columns" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."navigation_social_links" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."navigation" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload"."site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "payload"."hero_slides" CASCADE;
  DROP TABLE "payload"."stats" CASCADE;
  DROP TABLE "payload"."value_props" CASCADE;
  DROP TABLE "payload"."featured_vehicles_config" CASCADE;
  DROP TABLE "payload"."cta_blocks" CASCADE;
  DROP TABLE "payload"."testimonials" CASCADE;
  DROP TABLE "payload"."faqs" CASCADE;
  DROP TABLE "payload"."navigation_main_menu_children" CASCADE;
  DROP TABLE "payload"."navigation_main_menu" CASCADE;
  DROP TABLE "payload"."navigation_footer_columns_links" CASCADE;
  DROP TABLE "payload"."navigation_footer_columns" CASCADE;
  DROP TABLE "payload"."navigation_social_links" CASCADE;
  DROP TABLE "payload"."navigation" CASCADE;
  DROP TABLE "payload"."site_settings" CASCADE;
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_hero_slides_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stats_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_value_props_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_featured_vehicles_config_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_cta_blocks_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_testimonials_fk";
  
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faqs_fk";
  
  DROP INDEX "payload"."payload_locked_documents_rels_hero_slides_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_stats_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_value_props_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_featured_vehicles_config_i_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_cta_blocks_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_testimonials_id_idx";
  DROP INDEX "payload"."payload_locked_documents_rels_faqs_id_idx";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "hero_slides_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "stats_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "value_props_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "featured_vehicles_config_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "cta_blocks_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "testimonials_id";
  ALTER TABLE "payload"."payload_locked_documents_rels" DROP COLUMN "faqs_id";
  DROP TYPE "payload"."enum_hero_slides_status";
  DROP TYPE "payload"."enum_stats_status";
  DROP TYPE "payload"."enum_value_props_status";
  DROP TYPE "payload"."enum_featured_vehicles_config_selection_type";
  DROP TYPE "payload"."enum_cta_blocks_background_style";
  DROP TYPE "payload"."enum_cta_blocks_placement";
  DROP TYPE "payload"."enum_cta_blocks_status";
  DROP TYPE "payload"."enum_testimonials_category";
  DROP TYPE "payload"."enum_testimonials_status";
  DROP TYPE "payload"."enum_faqs_category";
  DROP TYPE "payload"."enum_faqs_status";
  DROP TYPE "payload"."enum_navigation_footer_columns_type";
  DROP TYPE "payload"."enum_navigation_social_links_platform";`)
}
