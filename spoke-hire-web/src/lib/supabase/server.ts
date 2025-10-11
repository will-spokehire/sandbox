import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

/**
 * Server-side Supabase client for Server Components, Server Actions, and Route Handlers
 * Uses cookies for session management
 * 
 * Usage in Server Components:
 * ```tsx
 * import { createClient } from '@/lib/supabase/server';
 * 
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * ```
 * 
 * Usage in Server Actions:
 * ```tsx
 * 'use server';
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export async function myAction() {
 *   const supabase = await createClient();
 *   // ... your code
 * }
 * ```
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/**
 * Admin client with service role key for privileged operations
 * WARNING: Only use this for server-side admin operations
 * Never expose service role key to the client
 * 
 * Usage:
 * ```tsx
 * import { createAdminClient } from '@/lib/supabase/server';
 * 
 * const supabase = createAdminClient();
 * // Bypass RLS policies, manage users, etc.
 * ```
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  return createServerClient<Database>(supabaseUrl, serviceRoleKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll() {
        // No-op for admin client
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

