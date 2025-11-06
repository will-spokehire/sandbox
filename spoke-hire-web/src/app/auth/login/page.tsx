import { Suspense } from 'react';
import { LoginForm } from '~/components/auth/LoginForm';
import { StandardPageHeader } from '~/app/_components/layouts';
import { LAYOUT_CONSTANTS } from '~/lib/design-tokens';

/**
 * Login Page
 * 
 * Public page for admin users to sign in with email OTP.
 */
export default function LoginPage() {
  return (
    <div className={LAYOUT_CONSTANTS.container + " " + LAYOUT_CONSTANTS.pageSpacing + " max-w-md mx-auto"}>
      <StandardPageHeader
        variant="form"
        title="Welcome Back"
        subtitle="Sign in to continue"
      />

      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
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
  title: 'Sign In - SpokeHire',
  description: 'Sign in to SpokeHire',
};

