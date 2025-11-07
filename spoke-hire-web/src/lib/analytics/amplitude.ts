/**
 * Amplitude Integration
 * 
 * Handles Amplitude event tracking and user identification.
 */

import * as amplitude from "@amplitude/analytics-browser";
import { 
  isAmplitudeEnabled, 
  AMPLITUDE_API_KEY, 
  shouldTrack,
  devLog 
} from "./analytics-config";

let isInitialized = false;

/**
 * Initialize Amplitude
 */
export function initAmplitude(): void {
  if (!isAmplitudeEnabled || isInitialized) return;
  
  try {
    amplitude.init(AMPLITUDE_API_KEY, undefined, {
      defaultTracking: {
        sessions: true,
        pageViews: false, // We'll track manually for better control
        formInteractions: false,
        fileDownloads: false,
      },
    });
    
    isInitialized = true;
    devLog("Amplitude", "initialized");
  } catch (error) {
    console.error("[Analytics] Amplitude initialization failed:", error);
  }
}

/**
 * Track event
 */
export function trackAmplitudeEvent(
  eventName: string,
  eventProperties?: Record<string, unknown>
): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("Amplitude", "event", { eventName, ...eventProperties });
    return;
  }
  
  try {
    amplitude.track(eventName, eventProperties);
  } catch (error) {
    console.error("[Analytics] Amplitude event failed:", error);
  }
}

/**
 * Identify user with traits
 */
export function identifyAmplitudeUser(
  userId: string,
  traits?: Record<string, unknown>
): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("Amplitude", "identify", { userId, ...traits });
    return;
  }
  
  try {
    const identifyEvent = new amplitude.Identify();
    
    if (traits) {
      Object.entries(traits).forEach(([key, value]) => {
        identifyEvent.set(key, value);
      });
    }
    
    amplitude.setUserId(userId);
    amplitude.identify(identifyEvent);
  } catch (error) {
    console.error("[Analytics] Amplitude identify failed:", error);
  }
}

/**
 * Set user properties
 */
export function setAmplitudeUserProperties(properties: Record<string, unknown>): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("Amplitude", "setUserProperties", properties);
    return;
  }
  
  try {
    const identifyEvent = new amplitude.Identify();
    
    Object.entries(properties).forEach(([key, value]) => {
      identifyEvent.set(key, value);
    });
    
    amplitude.identify(identifyEvent);
  } catch (error) {
    console.error("[Analytics] Amplitude setUserProperties failed:", error);
  }
}

/**
 * Reset Amplitude (on sign out)
 */
export function resetAmplitude(): void {
  if (!shouldTrack() || !isInitialized) {
    devLog("Amplitude", "reset");
    return;
  }
  
  try {
    amplitude.reset();
  } catch (error) {
    console.error("[Analytics] Amplitude reset failed:", error);
  }
}

