import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Reusable error state component
 * 
 * Provides a consistent error display across the application
 * with optional retry functionality and error details.
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load vehicles"
 *   description="There was an error loading the vehicle list"
 *   action={<Button onClick={retry}>Try Again</Button>}
 * />
 * ```
 */
export function ErrorState({
  title = "Something went wrong",
  description = "An unexpected error occurred",
  error,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={`flex items-center justify-center min-h-[400px] ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error Details</AlertTitle>
              <AlertDescription>
                {error.message || "An unexpected error occurred"}
              </AlertDescription>
            </Alert>
          )}

          {action && (
            <div className="flex justify-center">
              {action}
            </div>
          )}

          {(error as any)?.digest && (
            <p className="text-xs text-muted-foreground text-center">
              Error ID: {(error as any).digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
