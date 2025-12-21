"use client";

import Link from "next/link";
import { TYPOGRAPHY, VEHICLE_DETAIL } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

interface VehicleDetailBreadcrumbsProps {
  vehicle: {
    name: string;
  };
}

/**
 * Vehicle Detail Breadcrumbs
 * 
 * Displays breadcrumb navigation: "All cars > [Vehicle Name]"
 * Matches Figma design with responsive typography.
 */
export function VehicleDetailBreadcrumbs({ vehicle }: VehicleDetailBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn(VEHICLE_DETAIL.breadcrumbsTopPadding, VEHICLE_DETAIL.breadcrumbsHorizontalPadding, "pb-0")}>
      <p className={cn(TYPOGRAPHY.bodyLarge, "text-black")}>
        <Link href="/vehicles" className="hover:opacity-70 transition-opacity">
          All cars
        </Link>
        {" > "}
        <span>{vehicle.name}</span>
      </p>
    </nav>
  );
}

