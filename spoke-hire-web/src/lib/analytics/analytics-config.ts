/**
 * Analytics Configuration
 * 
 * Centralized configuration for Google Analytics 4 and Amplitude.
 * Handles environment-based initialization and consent management.
 */

// Check if we're in production (use process.env directly for client compatibility)
export const isProduction = process.env.NODE_ENV === "production";

// Analytics IDs (safe for client-side access with NEXT_PUBLIC_ prefix)
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";
export const AMPLITUDE_API_KEY = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY ?? "";

// Check if analytics is enabled (only in production and with proper keys)
// GA4 is now managed via GTM, so check for GTM_ID
export const isGAEnabled = isProduction && !!GTM_ID;
export const isAmplitudeEnabled = isProduction && !!AMPLITUDE_API_KEY;

// Consent state management
const CONSENT_KEY = "spokehire_analytics_consent";

export interface ConsentState {
  granted: boolean;
  timestamp: number;
}

/**
 * Get current consent state from localStorage
 */
export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as ConsentState;
  } catch {
    return null;
  }
}

/**
 * Set consent state in localStorage
 */
export function setConsentState(granted: boolean): void {
  if (typeof window === "undefined") return;
  
  const state: ConsentState = {
    granted,
    timestamp: Date.now(),
  };
  
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("[Analytics] Failed to save consent:", error);
  }
}

/**
 * Check if user has given consent
 */
export function hasConsent(): boolean {
  const consent = getConsent();
  return consent?.granted ?? false;
}

/**
 * Check if analytics should be active
 * (only in production with consent)
 */
export function shouldTrack(): boolean {
  if (!isProduction) return false;
  return hasConsent();
}

/**
 * Log analytics events in development
 */
export function devLog(category: string, action: string, data?: Record<string, unknown>): void {
  if (isProduction) return;
  
  console.log(
    `[Analytics] ${category}.${action}`,
    data ? JSON.stringify(data, null, 2) : ""
  );
}

