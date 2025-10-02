import { type VehicleStatus } from "@prisma/client";

/**
 * Vehicle utility functions
 */

/**
 * Format price for display
 * Accepts number, Decimal (from Prisma), or null/undefined
 */
export function formatPrice(price: number | { toNumber: () => number } | null | undefined): string {
  if (price === null || price === undefined) {
    return "N/A";
  }

  // Handle Prisma Decimal type
  const numericPrice = typeof price === "number" ? price : price.toNumber();

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericPrice);
}

/**
 * Get badge variant for vehicle status
 */
export function getStatusVariant(
  status: VehicleStatus
): "default" | "secondary" | "destructive" | "outline" {
  const variants = {
    DRAFT: "outline",
    PUBLISHED: "default",
    DECLINED: "destructive",
    ARCHIVED: "secondary",
  } as const;

  return variants[status];
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: VehicleStatus): string {
  const labels = {
    DRAFT: "Draft",
    PUBLISHED: "Published",
    DECLINED: "Declined",
    ARCHIVED: "Archived",
  };

  return labels[status];
}

/**
 * Format vehicle name with make and model
 */
export function formatVehicleName(
  name: string,
  make?: { name: string },
  model?: { name: string }
): string {
  if (!make || !model) {
    return name;
  }

  // If name already includes make/model, return as is
  if (name.toLowerCase().includes(make.name.toLowerCase())) {
    return name;
  }

  return `${make.name} ${model.name} - ${name}`;
}

/**
 * Format vehicle year
 */
export function formatYear(year: string | null | undefined): string {
  if (!year) return "N/A";
  return year;
}

/**
 * Get initials from name for avatar fallback
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  if (!firstName && !lastName) return "?";
  
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  
  return `${first}${last}` || "?";
}

/**
 * Format owner name
 */
export function formatOwnerName(
  firstName?: string | null,
  lastName?: string | null,
  email?: string
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  return email || "Unknown";
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format registration number
 */
export function formatRegistration(registration: string | null | undefined): string {
  if (!registration) return "N/A";
  
  // Format UK registration (e.g., "AB12CDE" -> "AB12 CDE")
  const cleaned = registration.replace(/\s/g, "").toUpperCase();
  
  if (cleaned.length === 7) {
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }
  
  return cleaned;
}

/**
 * Get image URL or placeholder
 * Prioritizes publishedUrl over originalUrl
 * Returns a data URI placeholder if no image is available
 */
export function getVehicleImageUrl(
  media: { publishedUrl?: string | null; originalUrl: string }[] | undefined,
  fallback?: string
): string {
  // Try to get publishedUrl or originalUrl from media
  if (media && media.length > 0) {
    const url = media[0]?.publishedUrl || media[0]?.originalUrl;
    if (url) return url;
  }
  
  // Return custom fallback if provided
  if (fallback) return fallback;
  
  // Return SVG data URI placeholder
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f1f5f9'/%3E%3Cg fill='%2394a3b8'%3E%3Cpath d='M200 120c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zm0 60c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z'/%3E%3Cpath d='M320 100H80c-11.046 0-20 8.954-20 20v120c0 11.046 8.954 20 20 20h240c11.046 0 20-8.954 20-20V120c0-11.046-8.954-20-20-20zm0 140H80V120h240v120z'/%3E%3C/g%3E%3Ctext x='200' y='270' font-family='system-ui, -apple-system, sans-serif' font-size='14' fill='%2394a3b8' text-anchor='middle'%3ENo Image%3C/text%3E%3C/svg%3E";
}

