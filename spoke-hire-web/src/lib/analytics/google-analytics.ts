/**
 * Google Analytics 4 Integration (via GTM)
 *
 * All GA4 events are pushed to the dataLayer for GTM to process.
 * The GA4 tag is configured inside GTM, not in code.
 */

// Extend Window interface for gtag and dataLayer
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (
      command: string,
      action: string,
      params?: Record<string, string>
    ) => void;
  }
}

import {
  isGAEnabled,
  shouldTrack,
  devLog
} from "./analytics-config";

let isInitialized = false;

/**
 * Push an event to the GTM dataLayer
 */
function pushToDataLayer(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(data);
}

/**
 * Initialize Google Analytics (via GTM)
 * GTM handles loading GA4, so this just marks as ready.
 */
export function initGA(): void {
  if (!isGAEnabled || isInitialized) return;

  isInitialized = true;
  devLog("GA", "initialized (via GTM)");
}

/**
 * Track page view
 */
export function trackPageView(path: string, title?: string): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("GA", "pageview", { path, title });
    return;
  }

  try {
    pushToDataLayer({
      event: "page_view",
      page_path: path,
      page_title: title,
    });
  } catch (error) {
    console.error("[Analytics] GA pageview failed:", error);
  }
}

/**
 * Track custom event
 */
export function trackEvent(
  category: string,
  action: string,
  label?: string,
  value?: number,
  additionalParams?: Record<string, unknown>
): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("GA", "event", { category, action, label, value, ...additionalParams });
    return;
  }

  try {
    pushToDataLayer({
      event: action,
      event_category: category,
      event_label: label,
      event_value: value,
      ...additionalParams,
    });
  } catch (error) {
    console.error("[Analytics] GA event failed:", error);
  }
}

/**
 * Set user ID (for authenticated users)
 */
export function setUserId(userId: string | null): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("GA", "setUserId", { userId });
    return;
  }

  try {
    pushToDataLayer({
      user_id: userId ?? undefined,
    });
  } catch (error) {
    console.error("[Analytics] GA setUserId failed:", error);
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, string>): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("GA", "setUserProperties", properties);
    return;
  }

  try {
    pushToDataLayer({
      user_properties: properties,
    });
  } catch (error) {
    console.error("[Analytics] GA setUserProperties failed:", error);
  }
}

/**
 * Reset GA (on sign out)
 */
export function resetGA(): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("GA", "reset");
    return;
  }

  try {
    pushToDataLayer({
      user_id: undefined,
    });
  } catch (error) {
    console.error("[Analytics] GA reset failed:", error);
  }
}

/**
 * Update gtag consent mode
 * This updates the consent state for GA4's consent mode API.
 * The gtag() helper is defined in layout.tsx and pushes to dataLayer,
 * which GTM reads to process consent commands.
 */
export function updateGtagConsent(granted: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    devLog("GA", "updateGtagConsent", { granted, status: "skipped (no gtag)" });
    return;
  }

  try {
    window.gtag("consent", "update", {
      analytics_storage: granted ? "granted" : "denied",
      ad_storage: granted ? "granted" : "denied",
    });
    devLog("GA", "updateGtagConsent", { granted, status: "updated" });
  } catch (error) {
    console.error("[Analytics] GA consent update failed:", error);
  }
}
