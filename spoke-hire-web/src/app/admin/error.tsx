"use client";

import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ErrorState } from "~/components/error/ErrorState";

/**
 * Admin Section Error Boundary
 * 
 * Catches errors in the admin section and provides
 * navigation back to the main admin dashboard.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Admin error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Error Content */}
      <main className="container mx-auto px-4 py-12">
        <ErrorState
          title="Admin Section Error"
          description="There was an error in the admin section"
          error={error}
          action={
            <div className="flex gap-3">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin">
                  Return to Dashboard
                </Link>
              </Button>
            </div>
          }
        />
      </main>
    </div>
  );
}
