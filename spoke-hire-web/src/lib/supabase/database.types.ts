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
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

