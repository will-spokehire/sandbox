"use client";

import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ErrorState } from "~/components/error/ErrorState";

/**
 * Vehicles List Error Boundary
 * 
 * Catches errors in the vehicles list page and provides
 * navigation back to the vehicles list.
 */
export default function VehiclesListError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Vehicles list error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-spoke-white">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-2">
              <Link href="/admin/vehicles">
                <ArrowLeft className="h-4 w-4" />
                Back to Vehicles
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Error Content */}
      <main className="container mx-auto px-4 py-12">
        <ErrorState
          title="Failed to Load Vehicles"
          description="There was an error loading the vehicles list"
          error={error}
          action={
            <div className="flex gap-3">
              <Button onClick={reset} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/vehicles">
                  Return to Vehicle List
                </Link>
              </Button>
            </div>
          }
        />
      </main>
    </div>
  );
}
