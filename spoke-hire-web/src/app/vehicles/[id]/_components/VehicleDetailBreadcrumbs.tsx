"use client";

import { VehicleBreadcrumbs, type BreadcrumbSegment } from "~/components/vehicles/VehicleBreadcrumbs";

interface VehicleDetailBreadcrumbsProps {
  vehicle: {
    make: {
      id: string;
      name: string;
    };
    model: {
      id: string;
      name: string;
    };
    owner: {
      city: string | null;
      county: string | null;
      country: {
        id: string;
        name: string;
      } | null;
    };
  };
}

/**
 * Vehicle Detail Breadcrumbs
 * 
 * Displays breadcrumb navigation: Vehicles > Location > Make > Model
 * Each segment is clickable and links back to the catalogue with appropriate filters
 */
export function VehicleDetailBreadcrumbs({ vehicle }: VehicleDetailBreadcrumbsProps) {
  // Build URL params for filters
  const buildFilterUrl = (filters: Record<string, string>) => {
    const params = new URLSearchParams(filters);
    return `/vehicles?${params.toString()}`;
  };

  const segments: BreadcrumbSegment[] = [];

  // Add country as first location segment (if available)
  if (vehicle.owner.country) {
    segments.push({
      label: vehicle.owner.country.name,
      href: buildFilterUrl({ countryIds: vehicle.owner.country.id }),
    });
  }

  // Add city as second location segment (if available)
  if (vehicle.owner.city && vehicle.owner.country) {
    segments.push({
      label: vehicle.owner.city,
      href: buildFilterUrl({ countryIds: vehicle.owner.country.id }),
    });
  }

  // Add make
  segments.push({
    label: vehicle.make.name,
    href: buildFilterUrl({
      ...(vehicle.owner.country && { countryIds: vehicle.owner.country.id }),
      makeIds: vehicle.make.id,
    }),
  });

  // Add model (clickable - links to catalogue with all filters)
  segments.push({
    label: vehicle.model.name,
    href: buildFilterUrl({
      ...(vehicle.owner.country && { countryIds: vehicle.owner.country.id }),
      makeIds: vehicle.make.id,
      modelId: vehicle.model.id,
    }),
  });

  return <VehicleBreadcrumbs segments={segments} className="mb-6" />;
}

