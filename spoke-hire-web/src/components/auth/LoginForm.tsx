'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import { GoogleAuthButton } from './GoogleAuthButton';

/**
 * Login Form Component
 * 
 * Allows admin users to sign in using email OTP (One-Time Password).
 * 
 * Flow:
 * 1. User enters email
 * 2. System sends OTP to email
 * 3. Email is stored in sessionStorage (not URL) for security
 * 4. User is redirected to OTP verification page
 * 
 * @example
 * ```tsx
 * <LoginForm termsUrl="/terms-of-service" privacyUrl="/privacy-policy" />
 * ```
 */
interface LoginFormProps {
  termsUrl?: string;
  privacyUrl?: string;
}

export function LoginForm({ termsUrl = '/terms-of-service', privacyUrl = '/privacy-policy' }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Get callbackUrl from search params
  const callbackUrl = searchParams.get('callbackUrl');

  // Show error if redirected from callback
  useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'auth_callback_failed') {
      toast.error('Authentication failed', {
        description: 'The magic link may have expired. Please request a new code.',
      });
    }
  }, [searchParams]);

  const signInMutation = api.auth.signInWithOtp.useMutation({
    onSuccess: () => {
      toast.success('Verification code sent!', {
        description: 'Check your email for the code.',
      });
      // Store email and callbackUrl in sessionStorage instead of URL for security
      sessionStorage.setItem('otp_email', email);
      if (callbackUrl) {
        sessionStorage.setItem('otp_callback_url', callbackUrl);
      }
      // Redirect to OTP verification page without email in URL
      router.push('/auth/verify-otp');
    },
    onError: (error: { message: string }) => {
      toast.error('Sign in failed', {
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await signInMutation.mutateAsync({
        email,
        redirectTo: `${window.location.origin}/auth/callback`,
      });
    } catch (error: unknown) {
      // Error handled by onError callback
      console.error('Sign in error:', error);
    }
  };

  return (
    <div className="w-full max-w-[808px] flex flex-col items-center gap-8 md:gap-[80px]">
      {/* Title Section */}
      <div className="w-full flex flex-col items-center gap-[11px] text-center">
        <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal">
          Sign in
        </h1>
        <p className="body-medium font-normal leading-[1.4] text-black tracking-[-0.18px]">
          Enter your email to receive a verification code.
        </p>
      </div>

      {/* Form Section */}
      <div className="w-full max-w-[480px] flex flex-col items-start gap-10">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-10">
          {/* Email Input */}
          <div className="w-full flex flex-col gap-5">
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
                autoFocus
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending code...' : 'send verification code'}
            </Button>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center justify-center h-5">
            <div className="flex-1 h-px bg-black" />
            <div className="px-2">
              <span className="text-base font-normal leading-[1.4] text-black text-center">
                Or
              </span>
            </div>
            <div className="flex-1 h-px bg-black" />
          </div>

          {/* Google Auth Button */}
          <GoogleAuthButton mode="signin" />

          {/* Terms and Privacy */}
          <div className="w-full text-center">
            <p className="text-base font-normal leading-[20px] text-black/50">
              By clicking continue, you agree to our{' '}
              <Link 
                href={termsUrl}
                className="underline decoration-solid underline-offset-auto"
              >
                Terms of Service
              </Link>
              {' '}and{' '}
              <Link 
                href={privacyUrl}
                className="underline decoration-solid underline-offset-auto"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          {/* Sign up link */}
          <div className="w-full text-center">
            <p className="text-base font-normal leading-[1.4] text-black/50">
              Don't have an account?{' '}
              <Link 
                href="/auth/signup" 
                className="text-base font-medium leading-[1.5] text-black underline decoration-solid underline-offset-auto"
              >
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

