"use client";

import { UserNavigation } from "./_components/UserNavigation";

/**
 * User Layout
 * 
 * Shared layout for all /user/* routes.
 * Provides consistent navigation across user pages.
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <UserNavigation />
      {children}
    </div>
  );
}

