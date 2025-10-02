import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

/**
 * Client-side Supabase client for browser/client components
 * Handles auth state, session management in the browser
 * 
 * Usage in Client Components:
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * const supabase = createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

