import { Suspense } from 'react';
import { LoginForm } from '~/components/auth/LoginForm';
import { getNavigation } from '~/lib/payload-api';

/**
 * Login Page
 * 
 * Public page for admin users to sign in with email OTP.
 */
export default async function LoginPage() {
  const navigation = await getNavigation();
  const footerSettings = navigation?.footerSettings;

  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 md:px-[30px] py-[41px]">
      <div className="w-full max-w-[808px] flex flex-col items-center gap-8 md:gap-[80px]">
        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm 
            termsUrl={footerSettings?.termsOfServiceUrl || '/terms-of-service'}
            privacyUrl={footerSettings?.privacyPolicyUrl || '/privacy-policy'}
          />
        </Suspense>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-[480px] flex flex-col items-center gap-[80px]">
      <div className="w-full flex flex-col items-center gap-[11px] animate-pulse">
        <div className="h-[96px] md:h-[96px] w-3/4 bg-slate-200 rounded" />
        <div className="h-5 w-full max-w-md bg-slate-200 rounded" />
      </div>
      <div className="w-full max-w-[480px] space-y-10">
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | SpokeHire',
  description: 'Sign in to your SpokeHire account to manage your classic vehicle enquiries.',
  robots: { index: false, follow: false },
};

