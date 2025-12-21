'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import { createClient } from '~/lib/supabase/client';
import { useAuth } from '~/providers/auth-provider';
import { trackEvent } from '~/lib/analytics';

/**
 * OTP Verification Component
 * 
 * Allows users to verify their email with a one-time password.
 * Email is stored in sessionStorage (not URL) for security.
 * 
 * @example
 * ```tsx
 * <OTPVerification />
 * ```
 */
export function OTPVerification() {
  const router = useRouter();
  const supabase = createClient();
  const { refreshSession } = useAuth();
  const utils = api.useUtils();

  // Get email from sessionStorage instead of URL for security
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  // Load email and callbackUrl from sessionStorage on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('otp_email');
    const storedCallbackUrl = sessionStorage.getItem('otp_callback_url');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (storedCallbackUrl) {
      setCallbackUrl(storedCallbackUrl);
    }
  }, []);

  // We still use the tRPC mutation to validate in our database
  const verifyMutation = api.auth.verifyOtp.useMutation({
    onSuccess: async (data) => {
      // Track successful verification - check if new user or returning user
      const isNewUser = !data.user.termsAcceptedAt || !data.user.privacyPolicyAcceptedAt;
      trackEvent(isNewUser ? 'user_signed_up' : 'otp_verification_success', {
        userType: data.user.userType,
        isNewUser,
      });
      
      toast.success('Successfully authenticated!', {
        description: `Welcome back, ${data.user.email}`,
      });
      // Clear stored email and callback URL after successful verification
      sessionStorage.removeItem('otp_email');
      sessionStorage.removeItem('otp_callback_url');
      
      // Invalidate and refetch session to update auth state
      await utils.auth.getSession.invalidate();
      await refreshSession();
      
      // Check if user has accepted T&Cs
      // If not, redirect to T&Cs acceptance page
      if (!data.user.termsAcceptedAt || !data.user.privacyPolicyAcceptedAt) {
        // Store callback URL before redirecting to T&C page so it can be restored after
        if (callbackUrl) {
          sessionStorage.setItem('post_terms_callback_url', callbackUrl);
        }
        // Redirect to T&Cs acceptance page
        setTimeout(() => {
          router.push('/auth/accept-terms');
        }, 100);
        return;
      }
      
      // Redirect to callback URL if provided, otherwise based on user type
      const redirectPath = callbackUrl ?? (data.user.userType === 'ADMIN' ? '/admin' : '/user/vehicles');
      
      // Small delay to ensure auth state is updated
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 100);
    },
    onError: (error) => {
      // Track verification failure
      trackEvent('otp_verification_failed', {
        error_message: error.message,
      });
      
      toast.error('Verification failed', {
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  const resendMutation = api.auth.resendOtp.useMutation({
    onSuccess: () => {
      toast.success('Code resent!', {
        description: 'Check your email for a new verification code.',
      });
    },
    onError: (error) => {
      toast.error('Failed to resend code', {
        description: error.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !otp) {
      toast.error('Please enter both email and verification code');
      return;
    }

    if (otp.length < 6) {
      toast.error('Verification code must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      // First, verify OTP with Supabase client-side (sets cookies)
      const { data: supabaseData, error: supabaseError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (supabaseError) {
        console.error('Supabase verify error:', supabaseError);
        toast.error('Verification failed', {
          description: supabaseError.message || 'Invalid or expired code',
        });
        setIsLoading(false);
        return;
      }

      if (!supabaseData.session) {
        toast.error('Failed to create session');
        setIsLoading(false);
        return;
      }

      // Then validate with our backend (checks admin role, updates DB)
      await verifyMutation.mutateAsync({
        email,
        token: otp,
      });
    } catch (error) {
      // Error handled by onError callback
      console.error('Verify OTP error:', error);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    try {
      await resendMutation.mutateAsync({ email });
    } catch (error) {
      console.error('Resend OTP error:', error);
    }
  };

  const handleBack = () => {
    router.push('/auth/login');
  };

  // Auto-focus OTP input if email is present
  useEffect(() => {
    if (email) {
      document.getElementById('otp')?.focus();
    }
  }, [email]);

  return (
    <div className="w-full max-w-[808px] flex flex-col items-center gap-20 md:gap-[80px]">
      {/* Title Section */}
      <div className="w-full flex flex-col items-center gap-[11px] text-center">
        <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal">
          Verify email
        </h1>
        <p className="body-medium font-normal leading-[1.4] text-black tracking-[-0.18px]">
          Enter the verification code sent to your email
        </p>
      </div>

      {/* Form Section */}
      <div className="w-full max-w-[480px] flex flex-col items-start gap-10">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-10">
          {/* Email Input */}
          <div className="w-full flex flex-col gap-1">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="admin@spokehire.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          {/* OTP Input */}
          <div className="w-full flex flex-col gap-1">
            <Input
              id="otp"
              type="text"
              label="Verification Code"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus={!!email}
              required
            />
            <p className="text-base font-normal leading-[1.4] text-black/50 mt-1">
              Enter the 6-digit code from your email
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email || !otp}
          >
            {isLoading ? 'Verifying...' : 'verify and sign in'}
          </Button>

          {/* Action Links */}
          <div className="w-full flex items-center justify-between text-base">
            <Button
              type="button"
              variant="link"
              onClick={handleResend}
              disabled={resendMutation.isPending || !email}
              className="px-0 h-auto text-base font-normal leading-[1.4] text-black/50 hover:text-black underline-offset-auto"
            >
              {resendMutation.isPending ? 'Sending...' : 'Resend code'}
            </Button>

            <Link
              href="/auth/login"
              className="text-base font-normal leading-[1.4] text-black/50 hover:text-black underline decoration-solid underline-offset-auto"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

