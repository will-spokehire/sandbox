import { type NextRequest } from 'next/server';
import { updateSession } from '~/lib/supabase/middleware';

/**
 * Next.js Middleware
 * 
 * Runs on every request before it reaches the page.
 * 
 * Responsibilities:
 * 1. Refresh Supabase auth tokens
 * 2. Update session cookies
 * 
 * Note: We don't do heavy auth checks here (like database queries)
 * because middleware runs on every request and should be fast.
 * Instead, we rely on:
 * - Server Components to check auth (via tRPC context)
 * - Client Components to use AuthGuard/useRequireAdmin
 * - Protected procedures in tRPC for API security
 */
export async function middleware(request: NextRequest) {
  // Update the Supabase session (refresh tokens if needed)
  // This ensures cookies are kept up-to-date
  return await updateSession(request);
}

/**
 * Middleware Configuration
 * 
 * Specify which routes the middleware should run on.
 * We want to:
 * - Run on all routes (for session refresh)
 * - But only do auth checks on /admin routes
 * - Skip static files and Next.js internals
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

