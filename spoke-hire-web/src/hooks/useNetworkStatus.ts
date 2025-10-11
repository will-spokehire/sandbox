"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

/**
 * Network status hook
 * 
 * Monitors network connectivity and provides offline/online state
 * with appropriate user feedback.
 * 
 * @example
 * ```typescript
 * const { isOnline, isOffline, connectionType } = useNetworkStatus();
 * 
 * if (isOffline) {
 *   return <OfflineMessage />;
 * }
 * ```
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string>("unknown");
  const [wasOffline, setWasOffline] = useState(false);

  // Handle online event
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      toast.success("Connection restored", {
        description: "You're back online. Your changes will sync automatically.",
        duration: 3000,
      });
      setWasOffline(false);
    }
  }, [wasOffline]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    toast.error("Connection lost", {
      description: "You're offline. Some features may not work properly.",
      duration: 5000,
    });
  }, []);

  // Handle connection change
  const handleConnectionChange = useCallback(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionType(connection.effectiveType || "unknown");
    }
  }, []);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);
    
    // Get connection type if available
    const connection = (navigator as any).connection;
    if (connection) {
      setConnectionType(connection.effectiveType || "unknown");
    }

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    if (connection) {
      connection.addEventListener("change", handleConnectionChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      
      if (connection) {
        connection.removeEventListener("change", handleConnectionChange);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange]);

  // Check if connection is slow
  const isSlowConnection = connectionType === "slow-2g" || connectionType === "2g";
  
  // Check if connection is fast
  const isFastConnection = connectionType === "4g";

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    isSlowConnection,
    isFastConnection,
    wasOffline,
  };
}
