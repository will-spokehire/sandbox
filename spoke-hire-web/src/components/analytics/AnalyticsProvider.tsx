/**
 * Analytics Provider
 * 
 * Initializes analytics services and tracks route changes.
 * Should be included at the root layout level.
 */

"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics, trackPageView, hasConsent, isProduction } from "~/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize analytics on mount (if consent is given or in dev mode)
  useEffect(() => {
    if (hasConsent() || !isProduction) {
      initAnalytics();
    }
  }, []);

  // Track page views on route changes
  useEffect(() => {
    // In production, require consent. In dev, always track for testing.
    if (!hasConsent() && isProduction) return;

    // Build full URL with search params
    const url = searchParams.toString() 
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Track page view
    trackPageView(url);
  }, [pathname, searchParams]);

  return <>{children}</>;
}

