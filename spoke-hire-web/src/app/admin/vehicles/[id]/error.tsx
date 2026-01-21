"use client";

import { useEffect } from "react";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

/**
 * Error State for Vehicle Detail Page
 */
export default function VehicleDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Vehicle detail page error:", error);
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
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle>Failed to Load Vehicle</CardTitle>
                  <CardDescription>
                    There was an error loading the vehicle details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error.message || "An unexpected error occurred"}
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={reset} variant="default">
                  Try Again
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/vehicles">
                    Return to Vehicle List
                  </Link>
                </Button>
              </div>

              {error.digest && (
                <p className="body-xs text-muted-foreground">
                  Error ID: {error.digest}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

