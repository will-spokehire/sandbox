"use client";

import Link from "next/link";
import { Home, ChevronRight } from "lucide-react";

export interface BreadcrumbSegment {
  label: string;
  href?: string | null;
  onClick?: () => void;
}

interface VehicleBreadcrumbsProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

/**
 * Shared Vehicle Breadcrumbs Component
 * 
 * Used across vehicle pages to display hierarchical navigation.
 * Structure: Home > Vehicles > [Dynamic Segments]
 * 
 * Supports both link-based navigation (href) and click handlers (onClick).
 * 
 * @example
 * // With links (detail page)
 * <VehicleBreadcrumbs segments={[
 *   { label: "England", href: "/vehicles?countryIds=uk" },
 *   { label: "BMW", href: "/vehicles?countryIds=uk&makeIds=bmw" },
 *   { label: "5 Series" }, // Current (no href)
 * ]} />
 * 
 * @example
 * // With click handlers (catalogue page)
 * <VehicleBreadcrumbs segments={[
 *   { label: "England", onClick: () => updateFilters(...) },
 *   { label: "BMW", onClick: () => updateFilters(...) },
 *   { label: "5 Series" }, // Current (no onClick)
 * ]} />
 */
export function VehicleBreadcrumbs({ segments, className = "mb-4" }: VehicleBreadcrumbsProps) {
  // Don't render if no segments
  if (segments.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {/* Home / Vehicles */}
        <li className="flex items-center gap-2">
          <Link
            href="/vehicles"
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Vehicles</span>
          </Link>
        </li>

        {/* Dynamic segments */}
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const hasLink = segment.href != null && segment.href !== "";
          const hasClickHandler = segment.onClick != null;
          const isClickable = hasLink || hasClickHandler;

          return (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {!isClickable ? (
                // No interactivity - display as text
                <span className="font-medium text-foreground">{segment.label}</span>
              ) : hasClickHandler ? (
                // Has onClick handler - render as button
                <button
                  onClick={segment.onClick}
                  className="font-medium text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
                  title={`Keep only filters up to ${segment.label}`}
                >
                  {segment.label}
                </button>
              ) : (
                // Has href - render as link
                <Link
                  href={segment.href!}
                  className="font-medium text-foreground hover:text-primary hover:underline transition-colors"
                >
                  {segment.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

