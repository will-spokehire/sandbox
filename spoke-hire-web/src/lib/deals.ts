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
  color: string;
} {
  const variants: Record<DealStatus, { variant: "default" | "secondary" | "destructive" | "outline"; label: string; color: string }> = {
    OPTIONS: { variant: "default", label: "Options", color: "blue" },
    CONTRACTS_INVOICE: { variant: "secondary", label: "Contracts & Invoice", color: "yellow" },
    COMPLETE: { variant: "outline", label: "Complete", color: "green" },
    POSTPONED: { variant: "secondary", label: "Postponed", color: "orange" },
    ABANDONED: { variant: "destructive", label: "Abandoned", color: "red" },
    ARCHIVED: { variant: "secondary", label: "Archived", color: "gray" },
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

