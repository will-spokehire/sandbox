'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Shield, FileText, Lock } from 'lucide-react';
import { api } from '~/trpc/react';
import { toast } from 'sonner';
import { useAuth } from '~/providers/auth-provider';

/**
 * Accept Terms Form Component
 * 
 * Displays T&Cs and Privacy Policy for user acceptance.
 * User must accept both to continue using the platform.
 */
export function AcceptTermsForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string | null>(null);

  // Load callback URL from sessionStorage on mount
  useEffect(() => {
    const storedCallbackUrl = sessionStorage.getItem('post_terms_callback_url');
    if (storedCallbackUrl) {
      setCallbackUrl(storedCallbackUrl);
    }
  }, []);

  const acceptTermsMutation = api.auth.acceptTerms.useMutation({
    onSuccess: () => {
      toast.success('Terms accepted!', {
        description: 'Thank you for accepting our terms.',
      });
      
      // Clear the callback URL from sessionStorage
      sessionStorage.removeItem('post_terms_callback_url');
      
      // Redirect to callback URL if provided, otherwise based on user type
      const redirectPath = callbackUrl ?? (user?.userType === 'ADMIN' ? '/admin' : '/user/vehicles');
      
      setTimeout(() => {
        router.push(redirectPath);
        router.refresh();
      }, 500);
    },
    onError: (error) => {
      toast.error('Failed to accept terms', {
        description: error.message,
      });
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      toast.error('Please accept the Terms & Conditions');
      return;
    }

    if (!privacyPolicyAccepted) {
      toast.error('Please accept the Privacy Policy');
      return;
    }

    setIsLoading(true);

    try {
      await acceptTermsMutation.mutateAsync({
        termsAccepted,
        privacyPolicyAccepted,
      });
    } catch (error: unknown) {
      // Error handled by onError callback
      console.error('Accept terms error:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <CardTitle className="text-2xl font-bold">Legal Agreement</CardTitle>
        </div>
        <CardDescription>
          Please review and accept our terms to continue using SpokeHire
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <FileText className="h-4 w-4" />
          <AlertDescription>
            By continuing, you agree to our Terms & Conditions and Privacy Policy. 
            You can review the full documents by clicking the links below.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Terms & Conditions Section */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
              <FileText className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-foreground">Terms & Conditions</h3>
                <p className="text-sm text-muted-foreground">
                  Our terms outline the rules and regulations for the use of SpokeHire's platform, 
                  including vehicle listings, bookings, and user responsibilities.
                </p>
                <Link 
                  href="/terms" 
                  target="_blank"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read full Terms & Conditions →
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                disabled={isLoading}
              />
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have read and agree to the Terms & Conditions
              </label>
            </div>
          </div>

          <Separator />

          {/* Privacy Policy Section */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/50">
              <Lock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-foreground">Privacy Policy</h3>
                <p className="text-sm text-muted-foreground">
                  Our privacy policy explains how we collect, use, and protect your personal information 
                  when you use our platform.
                </p>
                <Link 
                  href="/privacy" 
                  target="_blank"
                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                >
                  Read full Privacy Policy →
                </Link>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="privacy"
                checked={privacyPolicyAccepted}
                onCheckedChange={(checked) => setPrivacyPolicyAccepted(checked === true)}
                disabled={isLoading}
              />
              <label
                htmlFor="privacy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I have read and agree to the Privacy Policy
              </label>
            </div>
          </div>

          <Separator />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isLoading || !termsAccepted || !privacyPolicyAccepted}
          >
            {isLoading ? 'Accepting...' : 'Accept and Continue'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By clicking "Accept and Continue", you acknowledge that you have read and understood 
            both documents and agree to be bound by their terms.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

