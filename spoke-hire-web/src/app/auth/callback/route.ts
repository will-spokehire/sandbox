import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '~/lib/supabase/server';
import { db } from '~/server/db';

/**
 * Auth Callback Route Handler
 * 
 * Handles the OAuth callback from Supabase Auth.
 * This is used when users click the magic link in their email (alternative to OTP).
 * 
 * Flow:
 * 1. Supabase redirects to this route with auth code
 * 2. We exchange the code for a session
 * 3. Redirect user to appropriate dashboard based on user type
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = searchParams.get('next') ?? '/admin';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user to determine redirect path
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        
        if (supabaseUser?.email) {
          const user = await db.user.findUnique({
            where: { email: supabaseUser.email },
            select: { userType: true },
          });
          
          // Redirect based on user type
          if (user) {
            next = user.userType === 'ADMIN' ? '/admin' : '/dashboard';
          }
        }
      } catch (dbError) {
        console.error('Error fetching user type:', dbError);
        // Continue with default redirect
      }

      // Successfully authenticated, redirect to appropriate dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }

    console.error('Auth callback error:', error);
  }

  // If no code or error, redirect to login with error message
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}

