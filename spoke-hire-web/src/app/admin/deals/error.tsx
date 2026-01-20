"use client";

import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ErrorState } from "~/components/error/ErrorState";

/**
 * Deals List Error Boundary
 * 
 * Catches errors in the deals list page and provides
 * navigation back to the deals list.
 */
export default function DealsListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Deals list error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-spoke-white">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/admin/deals">
                <ArrowLeft className="h-4 w-4" />
                Back to Deals
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Error Content */}
      <main className="container mx-auto px-4 py-12">
        <ErrorState
          title="Failed to Load Deals"
          description="There was an error loading the deals list"
          error={error}
          action={
            <div className="flex gap-3">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/deals">
                  Return to Deals List
                </Link>
              </Button>
            </div>
          }
        />
      </main>
    </div>
  );
}
