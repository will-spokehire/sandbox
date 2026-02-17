/**
 * Analytics Unified API
 * 
 * Provides a single interface for tracking events across
 * Google Analytics 4 and Amplitude.
 */

import { initGA, trackPageView as gaPageView, trackEvent as gaEvent, setUserId as gaSetUserId, setUserProperties as gaSetUserProperties, resetGA, updateGtagConsent } from "./google-analytics";
import { initAmplitude, trackAmplitudeEvent, identifyAmplitudeUser, setAmplitudeUserProperties, resetAmplitude } from "./amplitude";
import { setConsentState as setConsentStorage, shouldTrack, devLog } from "./analytics-config";

// Re-export config utilities
export { hasConsent, getConsent, isProduction, isGAEnabled, isAmplitudeEnabled } from "./analytics-config";

/**
 * Initialize all analytics services
 * Should be called once on app mount
 */
export function initAnalytics(): void {
  if (!shouldTrack()) {
    devLog("Analytics", "init", { status: "skipped (no consent or not production)" });
    return;
  }
  
  // Update gtag consent mode for returning users who already gave consent
  updateGtagConsent(true);
  
  initGA();
  initAmplitude();
  devLog("Analytics", "init", { status: "initialized" });
}

/**
 * Track page view across all platforms
 */
export function trackPageView(path: string, title?: string): void {
  gaPageView(path, title);
  trackAmplitudeEvent("page_view", { path, title });
}

/**
 * Track custom event across all platforms
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, unknown>
): void {
  // GA expects category/action format, we'll use the event name
  const category = eventName.split("_")[0] ?? "general";
  const action = eventName;
  
  gaEvent(category, action, undefined, undefined, properties);
  trackAmplitudeEvent(eventName, properties);
}

/**
 * Identify user across all platforms
 */
export function identifyUser(
  userId: string,
  traits?: {
    email?: string;
    userType?: string;
    userStatus?: string;
    [key: string]: unknown;
  }
): void {
  gaSetUserId(userId);
  
  // Don't send PII to analytics - only use userType and status
  const sanitizedTraits = traits ? {
    userType: traits.userType,
    userStatus: traits.userStatus,
  } : undefined;
  
  identifyAmplitudeUser(userId, sanitizedTraits);
  
  if (sanitizedTraits) {
    gaSetUserProperties(sanitizedTraits as Record<string, string>);
  }
  
  devLog("Analytics", "identify", { userId, traits: sanitizedTraits });
}

/**
 * Set user properties across all platforms
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  setAmplitudeUserProperties(properties);
  gaSetUserProperties(properties as Record<string, string>);
}

/**
 * Update consent state and reinitialize if granted
 */
export function setConsent(granted: boolean): void {
  setConsentStorage(granted);
  updateGtagConsent(granted);
  
  if (granted) {
    initAnalytics();
    devLog("Analytics", "consent", { granted: true, status: "initialized" });
  } else {
    resetAnalytics();
    devLog("Analytics", "consent", { granted: false, status: "reset" });
  }
}

/**
 * Reset analytics (on sign out or consent withdrawal)
 */
export function resetAnalytics(): void {
  resetGA();
  resetAmplitude();
  devLog("Analytics", "reset");
}

// Export types for event properties
export interface VehicleViewedEvent {
  vehicleId: string;
  vehicleName?: string;
  make?: string;
  model?: string;
  year?: number;
}

export interface VehicleSearchEvent {
  makeIds?: string[];
  modelId?: string;
  decade?: string;
  collectionIds?: string[];
  countryIds?: string[];
  counties?: string[];
}

export interface EnquiryEvent {
  dealType?: string;
  hasVehicle?: boolean;
  vehicleId?: string;
}

export interface AuthEvent {
  userType?: string;
  userStatus?: string;
  isNewUser?: boolean;
}

