'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '~/providers/auth-provider';
import { Button } from '~/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      // Redirect based on user type
      if (user.userType === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/user/vehicles');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-50"></div>
      </div>
    );
  }

  // Show welcome page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-50 mb-4">
          Welcome to SpokeHire
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 mb-8">
          Manage your vehicle listings with ease
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/auth/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Create Account
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>

        <p className="text-sm text-slate-500 dark:text-slate-500 mt-8">
          Quick and easy registration - just enter your email to get started.
        </p>
      </div>
    </div>
  );
}
