import { Suspense } from 'react';
import { OTPVerification } from '~/components/auth/OTPVerification';

/**
 * OTP Verification Page
 * 
 * Page for users to verify their email with a one-time password.
 */
export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            SpokeHire
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Admin Portal
          </p>
        </div>

        <Suspense fallback={<OTPVerificationSkeleton />}>
          <OTPVerification />
        </Suspense>
      </div>
    </div>
  );
}

function OTPVerificationSkeleton() {
  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Verify Email - SpokeHire Admin',
  description: 'Verify your email to access the admin portal',
};

