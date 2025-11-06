import { Suspense } from 'react';
import { SignupForm } from '~/components/auth/SignupForm';

/**
 * Signup Page
 * 
 * Public page for new users to create an account with email OTP.
 */
export default function SignupPage() {
  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Join SpokeHire
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Create your account to get started
          </p>
        </div>

        <Suspense fallback={<SignupFormSkeleton />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}

function SignupFormSkeleton() {
  return (
    <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded" />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Sign Up - SpokeHire',
  description: 'Create your SpokeHire account',
};

