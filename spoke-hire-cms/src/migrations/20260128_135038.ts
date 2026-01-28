import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_stats_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_value_props_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_cta_blocks_actions_style" AS ENUM('primary', 'secondary', 'outline');
  CREATE TYPE "payload"."enum_cta_blocks_heading_level" AS ENUM('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
  CREATE TYPE "payload"."enum_cta_blocks_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_testimonials_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_faqs_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_carousel_images_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_spotlights_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_static_pages_blocks_stats_bar_display_style" AS ENUM('badges', 'cards', 'minimal', 'large');
  CREATE TYPE "payload"."enum_static_pages_blocks_value_props_section_display_style" AS ENUM('grid', 'list', 'carousel');
  CREATE TYPE "payload"."enum_static_pages_blocks_value_props_section_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "payload"."enum_static_pages_blocks_rich_text_content_header_type" AS ENUM('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
  CREATE TYPE "payload"."enum_static_pages_blocks_featured_vehicles_selection_type" AS ENUM('manual', 'latest');
  CREATE TYPE "payload"."enum_static_pages_blocks_spacer_height" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "payload"."enum_static_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_static_blocks_blocks_stats_bar_display_style" AS ENUM('badges', 'cards', 'minimal', 'large');
  CREATE TYPE "payload"."enum_static_blocks_blocks_value_props_section_display_style" AS ENUM('grid', 'list', 'carousel');
  CREATE TYPE "payload"."enum_static_blocks_blocks_value_props_section_columns" AS ENUM('2', '3', '4');
  CREATE TYPE "payload"."enum_static_blocks_blocks_rich_text_content_header_type" AS ENUM('h1', 'h2', 'h3', 'h4', 'h5', 'h6');
  CREATE TYPE "payload"."enum_static_blocks_blocks_featured_vehicles_selection_type" AS ENUM('manual', 'latest');
  CREATE TYPE "payload"."enum_static_blocks_blocks_spacer_height" AS ENUM('small', 'medium', 'large');
  CREATE TYPE "payload"."enum_static_blocks_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_navigation_footer_columns_type" AS ENUM('links', 'contact');
  CREATE TYPE "payload"."enum_navigation_social_links_platform" AS ENUM('facebook', 'instagram', 'twitter', 'linkedin');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload"."icons" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"svg_id" integer NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"icon_id" integer,
  	"status" "payload"."enum_stats_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."value_props" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"icon_id" integer,
  	"status" "payload"."enum_value_props_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."cta_blocks_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"link" varchar NOT NULL,
  	"style" "payload"."enum_cta_blocks_actions_style" DEFAULT 'primary' NOT NULL
  );
  
  CREATE TABLE "payload"."cta_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar NOT NULL,
  	"heading_level" "payload"."enum_cta_blocks_heading_level" DEFAULT 'h2' NOT NULL,
  	"description" varchar NOT NULL,
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
  	"status" "payload"."enum_testimonials_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."faqs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" jsonb NOT NULL,
  	"status" "payload"."enum_faqs_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."carousel_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"desktop_image_id" integer NOT NULL,
  	"mobile_image_id" integer,
  	"alt" varchar NOT NULL,
  	"status" "payload"."enum_carousel_images_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."spotlights" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL,
  	"caption" varchar NOT NULL,
  	"link" varchar,
  	"status" "payload"."enum_spotlights_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."static_pages_blocks_stats_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"display_style" "payload"."enum_static_pages_blocks_stats_bar_display_style" DEFAULT 'badges',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_value_props_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"display_style" "payload"."enum_static_pages_blocks_value_props_section_display_style" DEFAULT 'grid',
  	"columns" "payload"."enum_static_pages_blocks_value_props_section_columns" DEFAULT '4',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_testimonials_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"show_ratings" boolean DEFAULT true,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_faq_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" jsonb,
  	"default_expanded" boolean DEFAULT false,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_rich_text_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header" varchar,
  	"header_type" "payload"."enum_static_pages_blocks_rich_text_content_header_type" DEFAULT 'h2',
  	"content" jsonb NOT NULL,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_call_to_action_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selected_c_t_a_id" integer NOT NULL,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_featured_vehicles_vehicle_ids" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"vehicle_id" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_featured_vehicles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"selection_type" "payload"."enum_static_pages_blocks_featured_vehicles_selection_type" DEFAULT 'latest',
  	"limit" numeric DEFAULT 6,
  	"show_mobile_button" boolean DEFAULT true,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_image_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"autoplay" boolean DEFAULT true,
  	"autoplay_delay" numeric DEFAULT 5,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_project_spotlight" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'PROJECT SPOTLIGHT',
  	"show_arrows" boolean DEFAULT true,
  	"items_per_view" numeric DEFAULT 4,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_numbered_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"heading" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."static_pages_blocks_numbered_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_blocks_spacer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"height" "payload"."enum_static_pages_blocks_spacer_height" DEFAULT 'medium',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_pages_seo_keywords" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"keyword" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."static_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "payload"."enum_static_pages_status" DEFAULT 'draft' NOT NULL,
  	"published_at" timestamp(3) with time zone,
  	"seo_meta_title" varchar,
  	"seo_meta_description" varchar,
  	"seo_og_title" varchar,
  	"seo_og_description" varchar,
  	"seo_og_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."static_pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stats_id" integer,
  	"value_props_id" integer,
  	"testimonials_id" integer,
  	"faqs_id" integer,
  	"carousel_images_id" integer,
  	"spotlights_id" integer
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_stats_bar" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"display_style" "payload"."enum_static_blocks_blocks_stats_bar_display_style" DEFAULT 'badges',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_value_props_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"subtitle" varchar,
  	"display_style" "payload"."enum_static_blocks_blocks_value_props_section_display_style" DEFAULT 'grid',
  	"columns" "payload"."enum_static_blocks_blocks_value_props_section_columns" DEFAULT '4',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_testimonials_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"show_ratings" boolean DEFAULT true,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_faq_section" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" jsonb,
  	"default_expanded" boolean DEFAULT false,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_rich_text_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"header" varchar,
  	"header_type" "payload"."enum_static_blocks_blocks_rich_text_content_header_type" DEFAULT 'h2',
  	"content" jsonb NOT NULL,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_call_to_action_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"selected_c_t_a_id" integer NOT NULL,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_featured_vehicles_vehicle_ids" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"vehicle_id" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_featured_vehicles" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"subtitle" varchar,
  	"selection_type" "payload"."enum_static_blocks_blocks_featured_vehicles_selection_type" DEFAULT 'latest',
  	"limit" numeric DEFAULT 6,
  	"show_mobile_button" boolean DEFAULT true,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_image_carousel" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"autoplay" boolean DEFAULT true,
  	"autoplay_delay" numeric DEFAULT 5,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_project_spotlight" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'PROJECT SPOTLIGHT',
  	"show_arrows" boolean DEFAULT true,
  	"items_per_view" numeric DEFAULT 4,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_numbered_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"heading" varchar NOT NULL,
  	"description" varchar NOT NULL
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_numbered_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks_blocks_spacer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"height" "payload"."enum_static_blocks_blocks_spacer_height" DEFAULT 'medium',
  	"hide_on_mobile" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."static_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"page_slug" varchar NOT NULL,
  	"order" numeric DEFAULT 0,
  	"status" "payload"."enum_static_blocks_status" DEFAULT 'draft' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."static_blocks_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stats_id" integer,
  	"value_props_id" integer,
  	"testimonials_id" integer,
  	"faqs_id" integer,
  	"carousel_images_id" integer,
  	"spotlights_id" integer
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"icons_id" integer,
  	"stats_id" integer,
  	"value_props_id" integer,
  	"cta_blocks_id" integer,
  	"testimonials_id" integer,
  	"faqs_id" integer,
  	"carousel_images_id" integer,
  	"spotlights_id" integer,
  	"static_pages_id" integer,
  	"static_blocks_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
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
  	"home_slug" varchar DEFAULT '/',
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
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."icons" ADD CONSTRAINT "icons_svg_id_media_id_fk" FOREIGN KEY ("svg_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stats" ADD CONSTRAINT "stats_icon_id_icons_id_fk" FOREIGN KEY ("icon_id") REFERENCES "payload"."icons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."value_props" ADD CONSTRAINT "value_props_icon_id_icons_id_fk" FOREIGN KEY ("icon_id") REFERENCES "payload"."icons"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."cta_blocks_actions" ADD CONSTRAINT "cta_blocks_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."cta_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."carousel_images" ADD CONSTRAINT "carousel_images_desktop_image_id_media_id_fk" FOREIGN KEY ("desktop_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."carousel_images" ADD CONSTRAINT "carousel_images_mobile_image_id_media_id_fk" FOREIGN KEY ("mobile_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."spotlights" ADD CONSTRAINT "spotlights_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_stats_bar" ADD CONSTRAINT "static_pages_blocks_stats_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_value_props_section" ADD CONSTRAINT "static_pages_blocks_value_props_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_testimonials_section" ADD CONSTRAINT "static_pages_blocks_testimonials_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_faq_section" ADD CONSTRAINT "static_pages_blocks_faq_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_rich_text_content" ADD CONSTRAINT "static_pages_blocks_rich_text_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_call_to_action_block" ADD CONSTRAINT "static_pages_blocks_call_to_action_block_selected_c_t_a_id_cta_blocks_id_fk" FOREIGN KEY ("selected_c_t_a_id") REFERENCES "payload"."cta_blocks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_call_to_action_block" ADD CONSTRAINT "static_pages_blocks_call_to_action_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_featured_vehicles_vehicle_ids" ADD CONSTRAINT "static_pages_blocks_featured_vehicles_vehicle_ids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages_blocks_featured_vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_featured_vehicles" ADD CONSTRAINT "static_pages_blocks_featured_vehicles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_image_carousel" ADD CONSTRAINT "static_pages_blocks_image_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_project_spotlight" ADD CONSTRAINT "static_pages_blocks_project_spotlight_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_numbered_list_items" ADD CONSTRAINT "static_pages_blocks_numbered_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages_blocks_numbered_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_numbered_list" ADD CONSTRAINT "static_pages_blocks_numbered_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_blocks_spacer" ADD CONSTRAINT "static_pages_blocks_spacer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_seo_keywords" ADD CONSTRAINT "static_pages_seo_keywords_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages" ADD CONSTRAINT "static_pages_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_rels" ADD CONSTRAINT "static_pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_rels" ADD CONSTRAINT "static_pages_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "payload"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_rels" ADD CONSTRAINT "static_pages_rels_value_props_fk" FOREIGN KEY ("value_props_id") REFERENCES "payload"."value_props"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_rels" ADD CONSTRAINT "static_pages_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "payload"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_rels" ADD CONSTRAINT "static_pages_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "payload"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_rels" ADD CONSTRAINT "static_pages_rels_carousel_images_fk" FOREIGN KEY ("carousel_images_id") REFERENCES "payload"."carousel_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_pages_rels" ADD CONSTRAINT "static_pages_rels_spotlights_fk" FOREIGN KEY ("spotlights_id") REFERENCES "payload"."spotlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_stats_bar" ADD CONSTRAINT "static_blocks_blocks_stats_bar_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_value_props_section" ADD CONSTRAINT "static_blocks_blocks_value_props_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_testimonials_section" ADD CONSTRAINT "static_blocks_blocks_testimonials_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_faq_section" ADD CONSTRAINT "static_blocks_blocks_faq_section_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_rich_text_content" ADD CONSTRAINT "static_blocks_blocks_rich_text_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_call_to_action_block" ADD CONSTRAINT "static_blocks_blocks_call_to_action_block_selected_c_t_a_id_cta_blocks_id_fk" FOREIGN KEY ("selected_c_t_a_id") REFERENCES "payload"."cta_blocks"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_call_to_action_block" ADD CONSTRAINT "static_blocks_blocks_call_to_action_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_featured_vehicles_vehicle_ids" ADD CONSTRAINT "static_blocks_blocks_featured_vehicles_vehicle_ids_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks_blocks_featured_vehicles"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_featured_vehicles" ADD CONSTRAINT "static_blocks_blocks_featured_vehicles_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_image_carousel" ADD CONSTRAINT "static_blocks_blocks_image_carousel_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_project_spotlight" ADD CONSTRAINT "static_blocks_blocks_project_spotlight_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_numbered_list_items" ADD CONSTRAINT "static_blocks_blocks_numbered_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks_blocks_numbered_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_numbered_list" ADD CONSTRAINT "static_blocks_blocks_numbered_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_blocks_spacer" ADD CONSTRAINT "static_blocks_blocks_spacer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_rels" ADD CONSTRAINT "static_blocks_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_rels" ADD CONSTRAINT "static_blocks_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "payload"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_rels" ADD CONSTRAINT "static_blocks_rels_value_props_fk" FOREIGN KEY ("value_props_id") REFERENCES "payload"."value_props"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_rels" ADD CONSTRAINT "static_blocks_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "payload"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_rels" ADD CONSTRAINT "static_blocks_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "payload"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_rels" ADD CONSTRAINT "static_blocks_rels_carousel_images_fk" FOREIGN KEY ("carousel_images_id") REFERENCES "payload"."carousel_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."static_blocks_rels" ADD CONSTRAINT "static_blocks_rels_spotlights_fk" FOREIGN KEY ("spotlights_id") REFERENCES "payload"."spotlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_icons_fk" FOREIGN KEY ("icons_id") REFERENCES "payload"."icons"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stats_fk" FOREIGN KEY ("stats_id") REFERENCES "payload"."stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_value_props_fk" FOREIGN KEY ("value_props_id") REFERENCES "payload"."value_props"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cta_blocks_fk" FOREIGN KEY ("cta_blocks_id") REFERENCES "payload"."cta_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "payload"."testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faqs_fk" FOREIGN KEY ("faqs_id") REFERENCES "payload"."faqs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_carousel_images_fk" FOREIGN KEY ("carousel_images_id") REFERENCES "payload"."carousel_images"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_spotlights_fk" FOREIGN KEY ("spotlights_id") REFERENCES "payload"."spotlights"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_static_pages_fk" FOREIGN KEY ("static_pages_id") REFERENCES "payload"."static_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_static_blocks_fk" FOREIGN KEY ("static_blocks_id") REFERENCES "payload"."static_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu_children" ADD CONSTRAINT "navigation_main_menu_children_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation_main_menu"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_main_menu" ADD CONSTRAINT "navigation_main_menu_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_footer_columns_links" ADD CONSTRAINT "navigation_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_footer_columns" ADD CONSTRAINT "navigation_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_social_links" ADD CONSTRAINT "navigation_social_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."site_settings" ADD CONSTRAINT "site_settings_seo_defaults_default_og_image_id_media_id_fk" FOREIGN KEY ("seo_defaults_default_og_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "icons_svg_idx" ON "payload"."icons" USING btree ("svg_id");
  CREATE INDEX "icons_updated_at_idx" ON "payload"."icons" USING btree ("updated_at");
  CREATE INDEX "icons_created_at_idx" ON "payload"."icons" USING btree ("created_at");
  CREATE INDEX "stats_icon_idx" ON "payload"."stats" USING btree ("icon_id");
  CREATE INDEX "stats_updated_at_idx" ON "payload"."stats" USING btree ("updated_at");
  CREATE INDEX "stats_created_at_idx" ON "payload"."stats" USING btree ("created_at");
  CREATE INDEX "value_props_icon_idx" ON "payload"."value_props" USING btree ("icon_id");
  CREATE INDEX "value_props_updated_at_idx" ON "payload"."value_props" USING btree ("updated_at");
  CREATE INDEX "value_props_created_at_idx" ON "payload"."value_props" USING btree ("created_at");
  CREATE INDEX "cta_blocks_actions_order_idx" ON "payload"."cta_blocks_actions" USING btree ("_order");
  CREATE INDEX "cta_blocks_actions_parent_id_idx" ON "payload"."cta_blocks_actions" USING btree ("_parent_id");
  CREATE INDEX "cta_blocks_updated_at_idx" ON "payload"."cta_blocks" USING btree ("updated_at");
  CREATE INDEX "cta_blocks_created_at_idx" ON "payload"."cta_blocks" USING btree ("created_at");
  CREATE INDEX "testimonials_updated_at_idx" ON "payload"."testimonials" USING btree ("updated_at");
  CREATE INDEX "testimonials_created_at_idx" ON "payload"."testimonials" USING btree ("created_at");
  CREATE INDEX "faqs_updated_at_idx" ON "payload"."faqs" USING btree ("updated_at");
  CREATE INDEX "faqs_created_at_idx" ON "payload"."faqs" USING btree ("created_at");
  CREATE INDEX "carousel_images_desktop_image_idx" ON "payload"."carousel_images" USING btree ("desktop_image_id");
  CREATE INDEX "carousel_images_mobile_image_idx" ON "payload"."carousel_images" USING btree ("mobile_image_id");
  CREATE INDEX "carousel_images_updated_at_idx" ON "payload"."carousel_images" USING btree ("updated_at");
  CREATE INDEX "carousel_images_created_at_idx" ON "payload"."carousel_images" USING btree ("created_at");
  CREATE INDEX "spotlights_image_idx" ON "payload"."spotlights" USING btree ("image_id");
  CREATE INDEX "spotlights_updated_at_idx" ON "payload"."spotlights" USING btree ("updated_at");
  CREATE INDEX "spotlights_created_at_idx" ON "payload"."spotlights" USING btree ("created_at");
  CREATE INDEX "static_pages_blocks_stats_bar_order_idx" ON "payload"."static_pages_blocks_stats_bar" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_stats_bar_parent_id_idx" ON "payload"."static_pages_blocks_stats_bar" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_stats_bar_path_idx" ON "payload"."static_pages_blocks_stats_bar" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_value_props_section_order_idx" ON "payload"."static_pages_blocks_value_props_section" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_value_props_section_parent_id_idx" ON "payload"."static_pages_blocks_value_props_section" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_value_props_section_path_idx" ON "payload"."static_pages_blocks_value_props_section" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_testimonials_section_order_idx" ON "payload"."static_pages_blocks_testimonials_section" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_testimonials_section_parent_id_idx" ON "payload"."static_pages_blocks_testimonials_section" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_testimonials_section_path_idx" ON "payload"."static_pages_blocks_testimonials_section" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_faq_section_order_idx" ON "payload"."static_pages_blocks_faq_section" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_faq_section_parent_id_idx" ON "payload"."static_pages_blocks_faq_section" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_faq_section_path_idx" ON "payload"."static_pages_blocks_faq_section" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_rich_text_content_order_idx" ON "payload"."static_pages_blocks_rich_text_content" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_rich_text_content_parent_id_idx" ON "payload"."static_pages_blocks_rich_text_content" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_rich_text_content_path_idx" ON "payload"."static_pages_blocks_rich_text_content" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_call_to_action_block_order_idx" ON "payload"."static_pages_blocks_call_to_action_block" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_call_to_action_block_parent_id_idx" ON "payload"."static_pages_blocks_call_to_action_block" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_call_to_action_block_path_idx" ON "payload"."static_pages_blocks_call_to_action_block" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_call_to_action_block_selected_c_t_a_idx" ON "payload"."static_pages_blocks_call_to_action_block" USING btree ("selected_c_t_a_id");
  CREATE INDEX "static_pages_blocks_featured_vehicles_vehicle_ids_order_idx" ON "payload"."static_pages_blocks_featured_vehicles_vehicle_ids" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_featured_vehicles_vehicle_ids_parent_id_idx" ON "payload"."static_pages_blocks_featured_vehicles_vehicle_ids" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_featured_vehicles_order_idx" ON "payload"."static_pages_blocks_featured_vehicles" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_featured_vehicles_parent_id_idx" ON "payload"."static_pages_blocks_featured_vehicles" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_featured_vehicles_path_idx" ON "payload"."static_pages_blocks_featured_vehicles" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_image_carousel_order_idx" ON "payload"."static_pages_blocks_image_carousel" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_image_carousel_parent_id_idx" ON "payload"."static_pages_blocks_image_carousel" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_image_carousel_path_idx" ON "payload"."static_pages_blocks_image_carousel" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_project_spotlight_order_idx" ON "payload"."static_pages_blocks_project_spotlight" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_project_spotlight_parent_id_idx" ON "payload"."static_pages_blocks_project_spotlight" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_project_spotlight_path_idx" ON "payload"."static_pages_blocks_project_spotlight" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_numbered_list_items_order_idx" ON "payload"."static_pages_blocks_numbered_list_items" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_numbered_list_items_parent_id_idx" ON "payload"."static_pages_blocks_numbered_list_items" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_numbered_list_order_idx" ON "payload"."static_pages_blocks_numbered_list" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_numbered_list_parent_id_idx" ON "payload"."static_pages_blocks_numbered_list" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_numbered_list_path_idx" ON "payload"."static_pages_blocks_numbered_list" USING btree ("_path");
  CREATE INDEX "static_pages_blocks_spacer_order_idx" ON "payload"."static_pages_blocks_spacer" USING btree ("_order");
  CREATE INDEX "static_pages_blocks_spacer_parent_id_idx" ON "payload"."static_pages_blocks_spacer" USING btree ("_parent_id");
  CREATE INDEX "static_pages_blocks_spacer_path_idx" ON "payload"."static_pages_blocks_spacer" USING btree ("_path");
  CREATE INDEX "static_pages_seo_keywords_order_idx" ON "payload"."static_pages_seo_keywords" USING btree ("_order");
  CREATE INDEX "static_pages_seo_keywords_parent_id_idx" ON "payload"."static_pages_seo_keywords" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "static_pages_slug_idx" ON "payload"."static_pages" USING btree ("slug");
  CREATE INDEX "static_pages_seo_seo_og_image_idx" ON "payload"."static_pages" USING btree ("seo_og_image_id");
  CREATE INDEX "static_pages_updated_at_idx" ON "payload"."static_pages" USING btree ("updated_at");
  CREATE INDEX "static_pages_created_at_idx" ON "payload"."static_pages" USING btree ("created_at");
  CREATE INDEX "static_pages_rels_order_idx" ON "payload"."static_pages_rels" USING btree ("order");
  CREATE INDEX "static_pages_rels_parent_idx" ON "payload"."static_pages_rels" USING btree ("parent_id");
  CREATE INDEX "static_pages_rels_path_idx" ON "payload"."static_pages_rels" USING btree ("path");
  CREATE INDEX "static_pages_rels_stats_id_idx" ON "payload"."static_pages_rels" USING btree ("stats_id");
  CREATE INDEX "static_pages_rels_value_props_id_idx" ON "payload"."static_pages_rels" USING btree ("value_props_id");
  CREATE INDEX "static_pages_rels_testimonials_id_idx" ON "payload"."static_pages_rels" USING btree ("testimonials_id");
  CREATE INDEX "static_pages_rels_faqs_id_idx" ON "payload"."static_pages_rels" USING btree ("faqs_id");
  CREATE INDEX "static_pages_rels_carousel_images_id_idx" ON "payload"."static_pages_rels" USING btree ("carousel_images_id");
  CREATE INDEX "static_pages_rels_spotlights_id_idx" ON "payload"."static_pages_rels" USING btree ("spotlights_id");
  CREATE INDEX "static_blocks_blocks_stats_bar_order_idx" ON "payload"."static_blocks_blocks_stats_bar" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_stats_bar_parent_id_idx" ON "payload"."static_blocks_blocks_stats_bar" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_stats_bar_path_idx" ON "payload"."static_blocks_blocks_stats_bar" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_value_props_section_order_idx" ON "payload"."static_blocks_blocks_value_props_section" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_value_props_section_parent_id_idx" ON "payload"."static_blocks_blocks_value_props_section" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_value_props_section_path_idx" ON "payload"."static_blocks_blocks_value_props_section" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_testimonials_section_order_idx" ON "payload"."static_blocks_blocks_testimonials_section" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_testimonials_section_parent_id_idx" ON "payload"."static_blocks_blocks_testimonials_section" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_testimonials_section_path_idx" ON "payload"."static_blocks_blocks_testimonials_section" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_faq_section_order_idx" ON "payload"."static_blocks_blocks_faq_section" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_faq_section_parent_id_idx" ON "payload"."static_blocks_blocks_faq_section" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_faq_section_path_idx" ON "payload"."static_blocks_blocks_faq_section" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_rich_text_content_order_idx" ON "payload"."static_blocks_blocks_rich_text_content" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_rich_text_content_parent_id_idx" ON "payload"."static_blocks_blocks_rich_text_content" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_rich_text_content_path_idx" ON "payload"."static_blocks_blocks_rich_text_content" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_call_to_action_block_order_idx" ON "payload"."static_blocks_blocks_call_to_action_block" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_call_to_action_block_parent_id_idx" ON "payload"."static_blocks_blocks_call_to_action_block" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_call_to_action_block_path_idx" ON "payload"."static_blocks_blocks_call_to_action_block" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_call_to_action_block_selected_c_t_a_idx" ON "payload"."static_blocks_blocks_call_to_action_block" USING btree ("selected_c_t_a_id");
  CREATE INDEX "static_blocks_blocks_featured_vehicles_vehicle_ids_order_idx" ON "payload"."static_blocks_blocks_featured_vehicles_vehicle_ids" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_featured_vehicles_vehicle_ids_parent_id_idx" ON "payload"."static_blocks_blocks_featured_vehicles_vehicle_ids" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_featured_vehicles_order_idx" ON "payload"."static_blocks_blocks_featured_vehicles" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_featured_vehicles_parent_id_idx" ON "payload"."static_blocks_blocks_featured_vehicles" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_featured_vehicles_path_idx" ON "payload"."static_blocks_blocks_featured_vehicles" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_image_carousel_order_idx" ON "payload"."static_blocks_blocks_image_carousel" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_image_carousel_parent_id_idx" ON "payload"."static_blocks_blocks_image_carousel" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_image_carousel_path_idx" ON "payload"."static_blocks_blocks_image_carousel" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_project_spotlight_order_idx" ON "payload"."static_blocks_blocks_project_spotlight" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_project_spotlight_parent_id_idx" ON "payload"."static_blocks_blocks_project_spotlight" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_project_spotlight_path_idx" ON "payload"."static_blocks_blocks_project_spotlight" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_numbered_list_items_order_idx" ON "payload"."static_blocks_blocks_numbered_list_items" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_numbered_list_items_parent_id_idx" ON "payload"."static_blocks_blocks_numbered_list_items" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_numbered_list_order_idx" ON "payload"."static_blocks_blocks_numbered_list" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_numbered_list_parent_id_idx" ON "payload"."static_blocks_blocks_numbered_list" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_numbered_list_path_idx" ON "payload"."static_blocks_blocks_numbered_list" USING btree ("_path");
  CREATE INDEX "static_blocks_blocks_spacer_order_idx" ON "payload"."static_blocks_blocks_spacer" USING btree ("_order");
  CREATE INDEX "static_blocks_blocks_spacer_parent_id_idx" ON "payload"."static_blocks_blocks_spacer" USING btree ("_parent_id");
  CREATE INDEX "static_blocks_blocks_spacer_path_idx" ON "payload"."static_blocks_blocks_spacer" USING btree ("_path");
  CREATE INDEX "static_blocks_updated_at_idx" ON "payload"."static_blocks" USING btree ("updated_at");
  CREATE INDEX "static_blocks_created_at_idx" ON "payload"."static_blocks" USING btree ("created_at");
  CREATE INDEX "static_blocks_rels_order_idx" ON "payload"."static_blocks_rels" USING btree ("order");
  CREATE INDEX "static_blocks_rels_parent_idx" ON "payload"."static_blocks_rels" USING btree ("parent_id");
  CREATE INDEX "static_blocks_rels_path_idx" ON "payload"."static_blocks_rels" USING btree ("path");
  CREATE INDEX "static_blocks_rels_stats_id_idx" ON "payload"."static_blocks_rels" USING btree ("stats_id");
  CREATE INDEX "static_blocks_rels_value_props_id_idx" ON "payload"."static_blocks_rels" USING btree ("value_props_id");
  CREATE INDEX "static_blocks_rels_testimonials_id_idx" ON "payload"."static_blocks_rels" USING btree ("testimonials_id");
  CREATE INDEX "static_blocks_rels_faqs_id_idx" ON "payload"."static_blocks_rels" USING btree ("faqs_id");
  CREATE INDEX "static_blocks_rels_carousel_images_id_idx" ON "payload"."static_blocks_rels" USING btree ("carousel_images_id");
  CREATE INDEX "static_blocks_rels_spotlights_id_idx" ON "payload"."static_blocks_rels" USING btree ("spotlights_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_icons_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("icons_id");
  CREATE INDEX "payload_locked_documents_rels_stats_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("stats_id");
  CREATE INDEX "payload_locked_documents_rels_value_props_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("value_props_id");
  CREATE INDEX "payload_locked_documents_rels_cta_blocks_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("cta_blocks_id");
  CREATE INDEX "payload_locked_documents_rels_testimonials_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX "payload_locked_documents_rels_faqs_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("faqs_id");
  CREATE INDEX "payload_locked_documents_rels_carousel_images_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("carousel_images_id");
  CREATE INDEX "payload_locked_documents_rels_spotlights_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("spotlights_id");
  CREATE INDEX "payload_locked_documents_rels_static_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("static_pages_id");
  CREATE INDEX "payload_locked_documents_rels_static_blocks_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("static_blocks_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
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
  CREATE INDEX "site_settings_seo_defaults_seo_defaults_default_og_image_idx" ON "payload"."site_settings" USING btree ("seo_defaults_default_og_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."icons" CASCADE;
  DROP TABLE "payload"."stats" CASCADE;
  DROP TABLE "payload"."value_props" CASCADE;
  DROP TABLE "payload"."cta_blocks_actions" CASCADE;
  DROP TABLE "payload"."cta_blocks" CASCADE;
  DROP TABLE "payload"."testimonials" CASCADE;
  DROP TABLE "payload"."faqs" CASCADE;
  DROP TABLE "payload"."carousel_images" CASCADE;
  DROP TABLE "payload"."spotlights" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_stats_bar" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_value_props_section" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_testimonials_section" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_faq_section" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_rich_text_content" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_call_to_action_block" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_featured_vehicles_vehicle_ids" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_featured_vehicles" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_image_carousel" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_project_spotlight" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_numbered_list_items" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_numbered_list" CASCADE;
  DROP TABLE "payload"."static_pages_blocks_spacer" CASCADE;
  DROP TABLE "payload"."static_pages_seo_keywords" CASCADE;
  DROP TABLE "payload"."static_pages" CASCADE;
  DROP TABLE "payload"."static_pages_rels" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_stats_bar" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_value_props_section" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_testimonials_section" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_faq_section" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_rich_text_content" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_call_to_action_block" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_featured_vehicles_vehicle_ids" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_featured_vehicles" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_image_carousel" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_project_spotlight" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_numbered_list_items" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_numbered_list" CASCADE;
  DROP TABLE "payload"."static_blocks_blocks_spacer" CASCADE;
  DROP TABLE "payload"."static_blocks" CASCADE;
  DROP TABLE "payload"."static_blocks_rels" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."navigation_main_menu_children" CASCADE;
  DROP TABLE "payload"."navigation_main_menu" CASCADE;
  DROP TABLE "payload"."navigation_footer_columns_links" CASCADE;
  DROP TABLE "payload"."navigation_footer_columns" CASCADE;
  DROP TABLE "payload"."navigation_social_links" CASCADE;
  DROP TABLE "payload"."navigation" CASCADE;
  DROP TABLE "payload"."site_settings" CASCADE;
  DROP TYPE "payload"."enum_stats_status";
  DROP TYPE "payload"."enum_value_props_status";
  DROP TYPE "payload"."enum_cta_blocks_actions_style";
  DROP TYPE "payload"."enum_cta_blocks_heading_level";
  DROP TYPE "payload"."enum_cta_blocks_status";
  DROP TYPE "payload"."enum_testimonials_status";
  DROP TYPE "payload"."enum_faqs_status";
  DROP TYPE "payload"."enum_carousel_images_status";
  DROP TYPE "payload"."enum_spotlights_status";
  DROP TYPE "payload"."enum_static_pages_blocks_stats_bar_display_style";
  DROP TYPE "payload"."enum_static_pages_blocks_value_props_section_display_style";
  DROP TYPE "payload"."enum_static_pages_blocks_value_props_section_columns";
  DROP TYPE "payload"."enum_static_pages_blocks_rich_text_content_header_type";
  DROP TYPE "payload"."enum_static_pages_blocks_featured_vehicles_selection_type";
  DROP TYPE "payload"."enum_static_pages_blocks_spacer_height";
  DROP TYPE "payload"."enum_static_pages_status";
  DROP TYPE "payload"."enum_static_blocks_blocks_stats_bar_display_style";
  DROP TYPE "payload"."enum_static_blocks_blocks_value_props_section_display_style";
  DROP TYPE "payload"."enum_static_blocks_blocks_value_props_section_columns";
  DROP TYPE "payload"."enum_static_blocks_blocks_rich_text_content_header_type";
  DROP TYPE "payload"."enum_static_blocks_blocks_featured_vehicles_selection_type";
  DROP TYPE "payload"."enum_static_blocks_blocks_spacer_height";
  DROP TYPE "payload"."enum_static_blocks_status";
  DROP TYPE "payload"."enum_navigation_footer_columns_type";
  DROP TYPE "payload"."enum_navigation_social_links_platform";`)
}
