import { Suspense } from 'react';
import { LoginForm } from '~/components/auth/LoginForm';

/**
 * Login Page
 * 
 * Public page for admin users to sign in with email OTP.
 */
export default function LoginPage() {
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

        <Suspense fallback={<LoginFormSkeleton />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
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
  title: 'Sign In - SpokeHire Admin',
  description: 'Sign in to the SpokeHire admin portal',
};

