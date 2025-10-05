'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card';
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import { createClient } from '~/lib/supabase/client';

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

  // Get email from sessionStorage instead of URL for security
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load email from sessionStorage on mount
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('otp_email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  // We still use the tRPC mutation to validate in our database
  const verifyMutation = api.auth.verifyOtp.useMutation({
    onSuccess: (data) => {
      toast.success('Successfully authenticated!', {
        description: `Welcome back, ${data.user.email}`,
      });
      // Clear stored email after successful verification
      sessionStorage.removeItem('otp_email');
      // Redirect to admin dashboard
      router.push('/admin');
      router.refresh();
    },
    onError: (error) => {
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
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
        <CardDescription>
          Enter the verification code sent to your email
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
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              disabled={isLoading}
              maxLength={6}
              autoComplete="one-time-code"
              autoFocus={!!email}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the 6-digit code from your email
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !email || !otp}
          >
            {isLoading ? 'Verifying...' : 'Verify and sign in'}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <Button
              type="button"
              variant="link"
              onClick={handleResend}
              disabled={resendMutation.isPending || !email}
              className="px-0"
            >
              {resendMutation.isPending ? 'Sending...' : 'Resend code'}
            </Button>

            <Button
              type="button"
              variant="link"
              onClick={handleBack}
              disabled={isLoading}
              className="px-0"
            >
              Back to login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

