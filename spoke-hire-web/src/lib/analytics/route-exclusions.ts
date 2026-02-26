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
  // Check if the current path is excluded
  if (ANALYTICS_EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // Check if callbackUrl points to an excluded route (e.g. /auth/login?callbackUrl=/admin)
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl");
    if (
      callbackUrl &&
      ANALYTICS_EXCLUDED_PREFIXES.some((prefix) => callbackUrl.startsWith(prefix))
    ) {
      return true;
    }
  }

  return false;
}
