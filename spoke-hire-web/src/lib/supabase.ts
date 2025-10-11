import { createClient } from '@supabase/supabase-js';

/**
 * @deprecated This file is kept for backward compatibility with existing scripts.
 * For new code, please use:
 * - Client components: import { createClient } from '@/lib/supabase/client'
 * - Server components: import { createClient } from '@/lib/supabase/server'
 * - Middleware: import { updateSession } from '@/lib/supabase/middleware'
 * 
 * Legacy Supabase client for server-side operations (scripts)
 * Uses environment variables for configuration
 */
export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  // Use service role key for admin operations, fallback to anon key
  const key = serviceRoleKey ?? supabaseKey;
  
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * @deprecated Use the new Supabase client factories instead
 */
export const supabase = createSupabaseClient();


