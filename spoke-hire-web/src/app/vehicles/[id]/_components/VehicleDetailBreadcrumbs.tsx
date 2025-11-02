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
 * Each segment is clickable and links back to the catalog with appropriate filters
 */
export function VehicleDetailBreadcrumbs({ vehicle }: VehicleDetailBreadcrumbsProps) {
  // Build location string (City, County or just County, or just Country)
  const locationParts: string[] = [];
  if (vehicle.owner.city) locationParts.push(vehicle.owner.city);
  if (vehicle.owner.county) locationParts.push(vehicle.owner.county);
  if (vehicle.owner.country && locationParts.length === 0) {
    locationParts.push(vehicle.owner.country.name);
  }
  const locationString = locationParts.join(", ");

  // Build URL params for filters
  const buildFilterUrl = (filters: Record<string, string>) => {
    const params = new URLSearchParams(filters);
    return `/vehicles?${params.toString()}`;
  };

  const segments: BreadcrumbSegment[] = [];

  // Add location if available
  if (vehicle.owner.country) {
    segments.push({
      label: locationString || vehicle.owner.country.name,
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

  // Add model (clickable - links to catalog with all filters)
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

