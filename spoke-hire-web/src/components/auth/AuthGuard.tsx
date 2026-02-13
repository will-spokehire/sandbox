'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '~/providers/auth-provider';

interface AuthGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
  fallback?: ReactNode;
}

/**
 * Auth Guard Component
 * 
 * Client-side route protection. Redirects users if not authenticated.
 * 
 * @param requireAdmin - If true, requires admin role
 * @param fallback - Component to show while checking auth
 * 
 * @example
 * ```tsx
 * <AuthGuard requireAdmin>
 *   <AdminDashboard />
 * </AuthGuard>
 * ```
 */
export function AuthGuard({
  children,
  requireAdmin = false,
  fallback,
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        const callbackUrl = pathname ? encodeURIComponent(pathname) : '';
        router.push(callbackUrl ? `/auth/login?callbackUrl=${callbackUrl}` : '/auth/login');
      } else if (requireAdmin && user?.userType !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, requireAdmin, user, router, pathname]);

  if (isLoading) {
    return fallback ?? <AuthGuardLoading />;
  }

  if (!isAuthenticated) {
    return fallback ?? <AuthGuardLoading />;
  }

  if (requireAdmin && user?.userType !== 'ADMIN') {
    return fallback ?? <AuthGuardLoading />;
  }

  return <>{children}</>;
}

function AuthGuardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-spoke-white">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Checking authentication...
        </p>
      </div>
    </div>
  );
}

