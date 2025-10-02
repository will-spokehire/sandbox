/**
 * Database type definitions for Supabase
 * 
 * This is a placeholder file. You should generate this from your Supabase schema:
 * 
 * Run this command to generate types:
 * ```bash
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts
 * ```
 * 
 * Or if you're using local Supabase:
 * ```bash
 * npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
 * ```
 * 
 * For now, we'll use a minimal type definition that matches our Prisma schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // Add your Supabase tables here if you're using RLS
      // For now, we're primarily using Prisma with PostgreSQL
      // and Supabase only for authentication
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

