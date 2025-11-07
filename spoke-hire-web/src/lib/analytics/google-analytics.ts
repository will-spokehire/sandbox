/**
 * Google Analytics 4 Integration
 * 
 * Handles GA4 event tracking with Next.js router integration.
 */

import ReactGA from "react-ga4";
import { 
  isGAEnabled, 
  GA_MEASUREMENT_ID, 
  shouldTrack,
  devLog 
} from "./analytics-config";

let isInitialized = false;

/**
 * Initialize Google Analytics
 */
export function initGA(): void {
  if (!isGAEnabled || isInitialized) return;
  
  try {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gtagOptions: {
        anonymize_ip: true, // Anonymize IPs for privacy
        cookie_flags: "SameSite=None;Secure", // Modern cookie settings
      },
    });
    
    isInitialized = true;
    devLog("GA", "initialized");
  } catch (error) {
    console.error("[Analytics] GA initialization failed:", error);
  }
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
    ReactGA.send({ 
      hitType: "pageview", 
      page: path,
      title 
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
    ReactGA.event({
      category,
      action,
      label,
      value,
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
    if (userId) {
      ReactGA.set({ userId });
    } else {
      ReactGA.set({ userId: undefined });
    }
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
    ReactGA.set(properties);
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
    ReactGA.set({ userId: undefined });
  } catch (error) {
    console.error("[Analytics] GA reset failed:", error);
  }
}

