/**
 * Deal Utilities
 * 
 * Shared utilities for deal-related functionality across the admin interface.
 */

import type { DealStatus, DealType } from "@prisma/client";

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

/**
 * Get deal type label for display
 */
export function getDealTypeLabel(dealType: DealType): string {
  const labels: Record<DealType, string> = {
    PERSONAL_HIRE: "Personal hire",
    PRODUCTION: "Production",
  };
  
  return labels[dealType] ?? dealType.charAt(0).toUpperCase() + dealType.slice(1).toLowerCase();
}

/**
 * Get deal type badge configuration
 */
export function getDealTypeBadgeConfig(dealType: DealType): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  const configs: Record<DealType, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    PERSONAL_HIRE: { variant: "secondary", label: getDealTypeLabel(dealType) },
    PRODUCTION: { variant: "outline", label: getDealTypeLabel(dealType) },
  };
  
  return configs[dealType] ?? { variant: "default", label: getDealTypeLabel(dealType) };
}

