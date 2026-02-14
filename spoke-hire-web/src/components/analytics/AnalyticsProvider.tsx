/**
 * Analytics Provider
 * 
 * Initializes analytics services and tracks route changes.
 * Should be included at the root layout level.
 */

"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView, hasConsent, isProduction } from "~/lib/analytics";

/**
 * AnalyticsProvider
 * 
 * Initializes analytics services and tracks route changes.
 * Uses window.location.search instead of useSearchParams() to avoid
 * BAILOUT_TO_CLIENT_SIDE_RENDERING which breaks SSR/SEO.
 */
export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousUrlRef = useRef<string>("");

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

    // Build full URL with search params using window.location (avoids useSearchParams bailout)
    const search = typeof window !== "undefined" ? window.location.search : "";
    const url = search ? `${pathname}${search}` : pathname;

    // Avoid duplicate tracking for the same URL
    if (url === previousUrlRef.current) return;
    previousUrlRef.current = url;

    // Track page view
    trackPageView(url);
  }, [pathname]);

  return <>{children}</>;
}

