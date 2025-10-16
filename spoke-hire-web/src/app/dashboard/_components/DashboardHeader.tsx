'use client';

import { Button } from '~/components/ui/button';
import { useAuth } from '~/providers/auth-provider';

/**
 * Dashboard Header Component
 * 
 * Header for the user dashboard with user info and sign out button.
 */
export function DashboardHeader() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              SpokeHire
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {user?.email}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => void signOut()}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
}

