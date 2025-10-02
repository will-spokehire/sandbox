/**
 * Supabase Auth Integration for SpokeHire
 * 
 * This module provides Supabase authentication for the admin interface.
 * 
 * @module supabase
 * 
 * ## Usage Examples
 * 
 * ### Client Components (Browser)
 * ```tsx
 * 'use client';
 * import { createClient } from '@/lib/supabase/client';
 * 
 * export function LoginButton() {
 *   const supabase = createClient();
 *   
 *   const handleLogin = async (email: string) => {
 *     const { error } = await supabase.auth.signInWithOtp({ email });
 *   };
 * }
 * ```
 * 
 * ### Server Components
 * ```tsx
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export default async function Page() {
 *   const supabase = await createClient();
 *   const { data: { user } } = await supabase.auth.getUser();
 *   
 *   return <div>Welcome {user?.email}</div>;
 * }
 * ```
 * 
 * ### Server Actions
 * ```tsx
 * 'use server';
 * import { createClient } from '@/lib/supabase/server';
 * 
 * export async function signOut() {
 *   const supabase = await createClient();
 *   await supabase.auth.signOut();
 * }
 * ```
 * 
 * ### Middleware
 * ```tsx
 * import { updateSession } from '@/lib/supabase/middleware';
 * 
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request);
 * }
 * ```
 */

// Re-export for convenience
export { createClient as createBrowserClient } from './client';
export { createClient as createServerClient, createAdminClient } from './server';
export { updateSession, getAuthUser } from './middleware';
export type { Database } from './database.types';

