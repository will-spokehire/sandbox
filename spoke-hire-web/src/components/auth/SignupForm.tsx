'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import Link from 'next/link';

/**
 * Signup Form Component
 * 
 * Allows new users to create an account using email OTP (One-Time Password).
 * 
 * Flow:
 * 1. User enters email
 * 2. System sends OTP to email
 * 3. Email is stored in sessionStorage (not URL) for security
 * 4. User is redirected to OTP verification page
 * 5. On successful verification, account is auto-created
 * 
 * @example
 * ```tsx
 * <SignupForm />
 * ```
 */
export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      // Store email in sessionStorage instead of URL for security
      sessionStorage.setItem('otp_email', email);
      // Redirect to OTP verification page without email in URL
      router.push('/auth/verify-otp');
    },
    onError: (error: { message: string }) => {
      toast.error('Sign up failed', {
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
      console.error('Sign up error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Enter your email to get started with SpokeHire
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
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
            {isLoading ? 'Sending code...' : 'Create account'}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                How it works
              </span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="flex items-start gap-2">
              <span className="text-primary font-bold">1.</span>
              <span>Enter your email address</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary font-bold">2.</span>
              <span>Check your email for a verification code</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-primary font-bold">3.</span>
              <span>Enter the code to complete sign up</span>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

