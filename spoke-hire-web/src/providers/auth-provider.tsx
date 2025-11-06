'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@prisma/client';
import { createClient } from '~/lib/supabase/client';
import { api } from '~/trpc/react';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Auth Provider
 * 
 * Manages authentication state across the application.
 * Syncs with Supabase auth state changes and keeps user data updated.
 * 
 * Usage:
 * ```tsx
 * // In layout.tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 * 
 * // In any component
 * const { user, isAuthenticated, signOut } = useAuth();
 * ```
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // tRPC queries
  const { data: session, refetch: refetchSession, isLoading: sessionLoading } = api.auth.getSession.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: false,
    }
  );

  const signOutMutation = api.auth.signOut.useMutation({
    onSuccess: () => {
      setUser(null);
      router.push('/auth/login');
      router.refresh();
    },
  });

  // Update user when session changes
  useEffect(() => {
    // Only update state once the session query has completed
    if (!sessionLoading) {
      if (session?.user) {
        setUser(session.user as User);
        setIsLoading(false);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    }
  }, [session, sessionLoading]);

  // Listen to Supabase auth changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, _supabaseSession) => {
      console.log('[Auth] Supabase auth event:', event);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // Refresh session from our backend
        await refetchSession();
        router.refresh();
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        router.push('/auth/login');
        router.refresh();
      }

      if (event === 'USER_UPDATED') {
        await refetchSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router, refetchSession]);

  const signOut = async () => {
    await signOutMutation.mutateAsync();
  };

  const refreshSession = async () => {
    await refetchSession();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    signOut,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 * 
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * ```tsx
 * const { user, isAuthenticated, signOut } = useAuth();
 * 
 * if (!isAuthenticated) {
 *   return <LoginPrompt />;
 * }
 * 
 * return <div>Welcome, {user.email}</div>;
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to require authentication
 * 
 * Redirects to login if user is not authenticated.
 * Shows loading state while checking auth.
 * 
 * @example
 * ```tsx
 * export function ProtectedPage() {
 *   const { user, isLoading } = useRequireAuth();
 *   
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   // User is guaranteed to be authenticated here
 *   return <div>Welcome, {user.email}</div>;
 * }
 * ```
 */
export function useRequireAuth() {
  const context = useAuth();
  const router = useRouter();
  const [redirectPath, setRedirectPath] = useState('');
  
  // Capture the path only once on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !redirectPath) {
      setRedirectPath(window.location.pathname + window.location.search);
    }
  }, [redirectPath]);

  useEffect(() => {
    if (!context.isLoading && !context.isAuthenticated && redirectPath) {
      // Redirect to login with callback URL so user returns here after auth
      const callbackUrl = encodeURIComponent(redirectPath);
      router.push(`/auth/login?callbackUrl=${callbackUrl}`);
    }
  }, [context.isLoading, context.isAuthenticated, router, redirectPath]);

  return context;
}

/**
 * Hook to require admin role
 * 
 * Redirects to home if user is not an admin.
 * Shows loading state while checking auth.
 * 
 * @example
 * ```tsx
 * export function AdminPage() {
 *   const { user, isLoading } = useRequireAdmin();
 *   
 *   if (isLoading) {
 *     return <LoadingSpinner />;
 *   }
 *   
 *   // User is guaranteed to be an admin here
 *   return <div>Admin Dashboard</div>;
 * }
 * ```
 */
export function useRequireAdmin() {
  const context = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!context.isLoading) {
      if (!context.isAuthenticated) {
        router.push('/auth/login');
      } else if (context.user?.userType !== 'ADMIN') {
        router.push('/');
      }
    }
  }, [context.isLoading, context.isAuthenticated, context.user, router]);

  return context;
}

