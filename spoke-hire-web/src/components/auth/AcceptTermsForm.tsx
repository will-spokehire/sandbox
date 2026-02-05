'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
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
    <div className="w-full max-w-[808px] flex flex-col items-center gap-8 md:gap-[80px]">
      {/* Title Section */}
      <div className="w-full flex flex-col items-center gap-[11px] text-center">
        <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal">
          Legal agreement
        </h1>
        <p className="body-medium font-normal leading-[1.4] text-black tracking-[-0.18px]">
          Please review and accept our terms to continue using SpokeHire
        </p>
      </div>

      {/* Form Section */}
      <div className="w-full max-w-[480px] flex flex-col items-start gap-10">
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-10">
          {/* Terms & Conditions Section */}
          <div className="w-full flex flex-col gap-5">
            <div className="w-full flex flex-col gap-2 p-4">
              <h3 className="text-base font-medium text-black">Terms & Conditions</h3>
              <p className="text-base font-normal leading-[1.4] text-black/50">
                Our terms & conditions set out the rules and regulations for the use of SpokeHire's platform, including vehicle listings, bookings, and user responsibilities.
              </p>
              <Link 
                href="/terms-of-service" 
                target="_blank"
                className="text-base font-normal leading-[1.4] text-black underline decoration-solid underline-offset-auto inline-flex items-center gap-1"
              >
                Read full Terms & Conditions →
              </Link>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                disabled={isLoading}
              />
              <label
                htmlFor="terms"
                className="text-base font-medium leading-[1.4] text-black cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the Terms & Conditions
              </label>
            </div>
          </div>

          {/* Divider */}
          <div className="w-full flex items-center justify-center h-5">
            <div className="flex-1 h-px bg-black" />
          </div>

          {/* Privacy Policy Section */}
          <div className="w-full flex flex-col gap-5">
            <div className="w-full flex flex-col gap-2 p-4">
              <h3 className="text-base font-medium text-black">Privacy Policy</h3>
              <p className="text-base font-normal leading-[1.4] text-black/50">
                Our privacy policy explains how we collect, use, and protect your personal data when you use our platform.
              </p>
              <Link 
                href="/privacy-policy" 
                target="_blank"
                className="text-base font-normal leading-[1.4] text-black underline decoration-solid underline-offset-auto inline-flex items-center gap-1"
              >
                Read full Privacy Policy →
              </Link>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox
                id="privacy"
                checked={privacyPolicyAccepted}
                onCheckedChange={(checked) => setPrivacyPolicyAccepted(checked === true)}
                disabled={isLoading}
              />
              <label
                htmlFor="privacy"
                className="text-base font-medium leading-[1.4] text-black cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have read and agree to the terms of the Privacy Policy
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !termsAccepted || !privacyPolicyAccepted}
          >
            {isLoading ? 'Accepting...' : 'accept and continue'}
          </Button>

          {/* Footer Text */}
          <p className="text-base font-normal leading-[1.4] text-center text-black/50">
            By clicking "Accept and Continue", you acknowledge that you have read and understood 
            both documents and agree to be bound by their terms.
          </p>
        </form>
      </div>
    </div>
  );
}

