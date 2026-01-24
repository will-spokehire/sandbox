import { Suspense } from 'react';
import { OTPVerification } from '~/components/auth/OTPVerification';

/**
 * OTP Verification Page
 * 
 * Page for users to verify their email with a one-time password.
 */
export default function VerifyOtpPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center px-4 md:px-[30px] py-[41px]">
      <div className="w-full max-w-[808px] flex flex-col items-center gap-8 md:gap-[80px]">
        <Suspense fallback={<OTPVerificationSkeleton />}>
          <OTPVerification />
        </Suspense>
      </div>
    </div>
  );
}

function OTPVerificationSkeleton() {
  return (
    <div className="w-full max-w-[480px] flex flex-col items-center gap-[80px]">
      <div className="w-full flex flex-col items-center gap-[11px] animate-pulse">
        <div className="h-[96px] md:h-[96px] w-3/4 bg-slate-200 rounded" />
        <div className="h-5 w-full max-w-md bg-slate-200 rounded" />
      </div>
      <div className="w-full max-w-[480px] space-y-10">
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-10 bg-slate-200 rounded" />
        <div className="h-12 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Verify Email | SpokeHire',
  description: 'Verify your email address to complete your SpokeHire account setup.',
  robots: { index: false, follow: false },
};

