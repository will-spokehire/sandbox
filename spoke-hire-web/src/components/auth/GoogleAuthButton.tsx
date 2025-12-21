'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { createClient } from '~/lib/supabase/client';
import { toast } from 'sonner';

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup';
  termsAccepted?: boolean;
  privacyPolicyAccepted?: boolean;
  termsAcceptanceId?: string;
  privacyAcceptanceId?: string;
}

/**
 * Google OAuth Button Component
 * 
 * Handles sign in / sign up with Google OAuth.
 * Uses Supabase client-side OAuth flow with PKCE.
 * 
 * Features:
 * - Redirects to Google OAuth consent screen
 * - Handles errors with toast notifications
 * - Stores T&Cs acceptance in sessionStorage for signup flow
 * - Loading state during OAuth redirect
 * 
 * @example
 * ```tsx
 * <GoogleAuthButton mode="signin" />
 * <GoogleAuthButton 
 *   mode="signup" 
 *   termsAccepted={true}
 *   termsAcceptanceId="uuid"
 * />
 * ```
 */
export function GoogleAuthButton({
  mode = 'signin',
  termsAccepted,
  privacyPolicyAccepted,
  termsAcceptanceId,
  privacyAcceptanceId,
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    
    try {
      const supabase = createClient();

      // Store T&Cs acceptance in sessionStorage for callback
      if (mode === 'signup' && termsAccepted && privacyPolicyAccepted) {
        sessionStorage.setItem('oauth_terms_accepted', 'true');
        sessionStorage.setItem('oauth_privacy_accepted', 'true');
        if (termsAcceptanceId) {
          sessionStorage.setItem('oauth_terms_id', termsAcceptanceId);
        }
        if (privacyAcceptanceId) {
          sessionStorage.setItem('oauth_privacy_id', privacyAcceptanceId);
        }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback/google`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error('Failed to sign in with Google', {
          description: error.message,
        });
        setIsLoading(false);
      }
      // Note: If success, user will be redirected (no need to stop loading)
    } catch (error: unknown) {
      console.error('Google OAuth error:', error);
      toast.error('An unexpected error occurred', {
        description: 'Please try again later.',
      });
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="w-full h-9 bg-white border border-black/20 flex items-center justify-center px-4 py-2 shadow-[0px_1px_2px_-1px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)] disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
    >
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 488 512"
        >
          <path
            fill="currentColor"
            d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
          ></path>
        </svg>
        <span className="text-base font-normal leading-[20px] text-black text-center">
          {isLoading
            ? 'Redirecting...'
            : mode === 'signup'
            ? 'Continue with Google'
            : 'Continue with Google'}
        </span>
      </div>
    </button>
  );
}

