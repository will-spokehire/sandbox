import { Suspense } from 'react';
import { AcceptTermsForm } from '~/components/auth/AcceptTermsForm';

/**
 * Accept Terms & Conditions Page
 * 
 * Required page for users who haven't accepted T&Cs and Privacy Policy yet.
 * Users are redirected here after successful OTP verification if they haven't accepted.
 */
export default function AcceptTermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Welcome to SpokeHire
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Please review and accept our terms to continue
          </p>
        </div>

        <Suspense fallback={<AcceptTermsFormSkeleton />}>
          <AcceptTermsForm />
        </Suspense>
      </div>
    </div>
  );
}

function AcceptTermsFormSkeleton() {
  return (
    <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Accept Terms - SpokeHire',
  description: 'Review and accept SpokeHire terms and privacy policy',
};

