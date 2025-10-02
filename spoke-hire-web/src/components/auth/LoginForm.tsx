'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { api } from '~/trpc/react';
import { toast } from 'sonner';

/**
 * Login Form Component
 * 
 * Allows admin users to sign in using email OTP (One-Time Password).
 * 
 * Flow:
 * 1. User enters email
 * 2. System sends OTP to email
 * 3. User is redirected to OTP verification page
 * 
 * @example
 * ```tsx
 * <LoginForm />
 * ```
 */
export function LoginForm() {
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
      // Redirect to OTP verification page with email in state
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}`);
    },
    onError: (error) => {
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
    } catch (error) {
      // Error handled by onError callback
      console.error('Sign in error:', error);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Admin Sign In</CardTitle>
        <CardDescription>
          Enter your email to receive a verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
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
            {isLoading ? 'Sending code...' : 'Send verification code'}
          </Button>

          <p className="text-sm text-muted-foreground text-center">
            Admin access only. Contact support if you need assistance.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

