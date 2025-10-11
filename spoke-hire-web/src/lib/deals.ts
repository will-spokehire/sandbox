/**
 * Deal Utilities
 * 
 * Shared utilities for deal-related functionality across the admin interface.
 */

import type { DealStatus } from "@prisma/client";

/**
 * Get status badge variant and label for a deal
 */
export function getDealStatusConfig(status: DealStatus): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  const variants: Record<DealStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    ACTIVE: { variant: "default", label: "Active" },
    ARCHIVED: { variant: "secondary", label: "Archived" },
  };

  return variants[status];
}

/**
 * Format deal date for display
 */
export function formatDealDate(date: string | null): string {
  if (!date) return "No date set";
  
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
}

/**
 * Format deal time for display
 */
export function formatDealTime(time: string | null): string {
  if (!time) return "No time set";
  return time;
}

