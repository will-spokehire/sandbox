"use client";

import { useNetworkStatus } from "~/hooks/useNetworkStatus";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Wifi, WifiOff, AlertTriangle } from "lucide-react";

/**
 * Network Status Component
 * 
 * Displays network connectivity status and provides user feedback
 * when the connection is lost or restored.
 * 
 * @example
 * ```tsx
 * <NetworkStatus />
 * ```
 */
export function NetworkStatus() {
  const { isOnline, isOffline, connectionType, isSlowConnection } = useNetworkStatus();

  // Don't render anything if online and connection is good
  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {isOffline ? (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <strong>You're offline</strong>
            <br />
            Some features may not work properly. Your changes will sync when you're back online.
          </AlertDescription>
        </Alert>
      ) : isSlowConnection ? (
        <Alert variant="default" className="shadow-lg border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <strong>Slow connection detected</strong>
            <br />
            Your connection is slow ({connectionType}). Some features may take longer to load.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="default" className="shadow-lg border-green-200 bg-green-50">
          <Wifi className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Connection restored</strong>
            <br />
            You're back online. Your changes will sync automatically.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
