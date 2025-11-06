'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '~/providers/auth-provider';

/**
 * Root Page
 * 
 * Redirects users based on authentication state:
 * - Admin users → /admin
 * - All other users (authenticated or not) → /vehicles
 */
export default function Home() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Redirect admins to admin dashboard
      if (isAuthenticated && user?.userType === 'ADMIN') {
        router.push('/admin');
      } else {
        // Everyone else goes to vehicles (public catalog)
        router.push('/vehicles');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading state while checking auth and redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-50"></div>
    </div>
  );
}
