'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '~/lib/supabase/client';
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

/**
 * Google OAuth Callback Page
 * 
 * Handles the OAuth callback from Google via Supabase.
 * 
 * Flow:
 * 1. Supabase automatically exchanges auth code for session
 * 2. We verify the session exists
 * 3. Call our backend to validate/create user in database
 * 4. Redirect to appropriate dashboard based on userType
 * 
 * This is a client component because:
 * - Need to access sessionStorage for T&Cs data
 * - Need to call tRPC mutation with user data
 * - Need to handle loading state and redirects
 */
export default function GoogleCallbackPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const verifyMutation = api.auth.verifyGoogleAuth.useMutation({
    onSuccess: (data) => {
      // Redirect based on user type
      const redirect = data.user.userType === 'ADMIN' ? '/admin' : '/user/vehicles';
      
      toast.success('Welcome!', {
        description: `Successfully signed in as ${data.user.email}`,
      });
      
      router.push(redirect);
    },
    onError: (error) => {
      console.error('Google auth verification error:', error);
      setError(error.message);
      setIsVerifying(false);
      
      toast.error('Authentication failed', {
        description: error.message,
      });
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/auth/login?error=oauth_verification_failed');
      }, 3000);
    },
  });

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const supabase = createClient();
        
        // Get authenticated user from Supabase
        const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Supabase auth error:', authError);
          throw new Error('Failed to get authenticated user');
        }

        if (!supabaseUser?.email) {
          throw new Error('No authenticated session found');
        }

        // Get T&Cs acceptance data from sessionStorage (if signup flow)
        const termsAccepted = sessionStorage.getItem('oauth_terms_accepted') === 'true';
        const privacyAccepted = sessionStorage.getItem('oauth_privacy_accepted') === 'true';
        const termsId = sessionStorage.getItem('oauth_terms_id');
        const privacyId = sessionStorage.getItem('oauth_privacy_id');
        
        // Clear sessionStorage
        sessionStorage.removeItem('oauth_terms_accepted');
        sessionStorage.removeItem('oauth_privacy_accepted');
        sessionStorage.removeItem('oauth_terms_id');
        sessionStorage.removeItem('oauth_privacy_id');

        // Get full name from Google user metadata
        const fullName = supabaseUser.user_metadata?.full_name as string | undefined;
        
        // Verify with backend (creates user if new)
        await verifyMutation.mutateAsync({
          email: supabaseUser.email,
          name: fullName,
          termsAccepted: termsAccepted || undefined,
          termsAcceptanceId: termsId ?? undefined,
          privacyPolicyAccepted: privacyAccepted || undefined,
          privacyAcceptanceId: privacyId ?? undefined,
        });
      } catch (err: unknown) {
        console.error('OAuth callback error:', err);
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(errorMessage);
        setIsVerifying(false);
        
        toast.error('Authentication failed', {
          description: errorMessage,
        });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?error=oauth_callback_failed');
        }, 3000);
      }
    };

    verifyAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center">
            {isVerifying ? 'Completing sign in...' : 'Authentication failed'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground text-center">
                Please wait while we verify your account
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-destructive/10 p-3">
                <svg
                  className="h-6 w-6 text-destructive"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {error}
              </p>
              <p className="body-xs text-muted-foreground text-center">
                Redirecting to login page...
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

