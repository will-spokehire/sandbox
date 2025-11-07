/**
 * Vehicle View Tracker
 * 
 * Client component that tracks vehicle detail page views.
 * Used in server components to add analytics tracking.
 */

"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "~/lib/analytics";

interface VehicleViewTrackerProps {
  vehicleId: string;
  vehicleName: string;
  make: string;
  model: string;
  year: number;
}

export function VehicleViewTracker({
  vehicleId,
  vehicleName,
  make,
  model,
  year,
}: VehicleViewTrackerProps) {
  // Use ref to ensure tracking only happens once, even in Strict Mode
  const hasTracked = useRef(false);
  
  useEffect(() => {
    // Only track once per mount
    if (!hasTracked.current) {
      hasTracked.current = true;
      
      // Track vehicle view on mount
      trackEvent('vehicle_viewed', {
        vehicleId,
        vehicleName,
        make,
        model,
        year,
      });
    }
  }, [vehicleId, vehicleName, make, model, year]);

  // This component doesn't render anything
  return null;
}

