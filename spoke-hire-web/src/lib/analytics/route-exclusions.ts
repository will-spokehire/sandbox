/**
 * Route Exclusion Configuration for Analytics
 *
 * Defines routes where GTM and analytics tracking should be suppressed.
 * Used by GoogleTagManager, AnalyticsProvider, and CookieBanner.
 */

/** Route prefixes where analytics should NOT fire */
export const ANALYTICS_EXCLUDED_PREFIXES = ["/admin"];

/** Check if a given pathname should be excluded from analytics */
export function isAnalyticsExcludedRoute(pathname: string): boolean {
  return ANALYTICS_EXCLUDED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}
