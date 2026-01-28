"use client";

import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ErrorState } from "~/components/error/ErrorState";

/**
 * Root Error Boundary
 * 
 * Catches any unhandled errors in the application and provides
 * a fallback UI with retry functionality.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Root error boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-spoke-white flex items-center justify-center p-4">
      <ErrorState
        title="Application Error"
        description="Something went wrong with the application"
        error={error}
        action={
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        }
      />
    </div>
  );
}
