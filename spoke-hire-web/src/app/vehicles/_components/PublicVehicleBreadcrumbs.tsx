"use client";

import { usePublicVehicleFiltersContext } from "~/contexts/PublicVehicleFiltersContext";
import { VehicleBreadcrumbs, type BreadcrumbSegment } from "~/components/vehicles/VehicleBreadcrumbs";

interface PublicVehicleBreadcrumbsProps {
  serverFilterOptions: any;
}

/**
 * Public Vehicle Catalog Breadcrumbs
 * 
 * Displays active filters as a cumulative breadcrumb path:
 * Home > Vehicles > Country > County > Make > Model > Decade > Collections
 * 
 * Each level is clickable - clicking removes all filters to the right.
 * 
 * Uses server-provided filter options for instant rendering (no client fetch).
 */
export function PublicVehicleBreadcrumbs({ serverFilterOptions }: PublicVehicleBreadcrumbsProps) {
  const { filters, updateFilters } = usePublicVehicleFiltersContext();

  // Use server-provided filter options (no client-side fetch needed!)
  const filterOptions = serverFilterOptions;

  // Build breadcrumb segments in hierarchical order
  const segments: Array<{
    label: string;
    level: 'country' | 'county' | 'make' | 'model' | 'decade' | 'collection';
  }> = [];

  // 1. Countries
  if (filters.countryIds && filters.countryIds.length > 0) {
    const countries = filterOptions?.countries?.filter(c => filters.countryIds?.includes(c.id)) ?? [];
    const countryNames = countries.map(c => c.name);
    if (countryNames.length > 0) {
      segments.push({
        label: countryNames.join(", "),
        level: 'country',
      });
    }
  }

  // 2. Counties
  if (filters.counties && filters.counties.length > 0) {
    segments.push({
      label: filters.counties.join(", "),
      level: 'county',
    });
  }

  // 3. Makes
  if (filters.makeIds && filters.makeIds.length > 0) {
    const makes = filterOptions?.makes?.filter(m => filters.makeIds?.includes(m.id)) ?? [];
    const makeNames = makes.map(m => m.name);
    if (makeNames.length > 0) {
      segments.push({
        label: makeNames.join(", "),
        level: 'make',
      });
    }
  }

  // 4. Model
  if (filters.modelId) {
    const model = filterOptions?.models?.find(m => m.id === filters.modelId);
    if (model) {
      segments.push({
        label: model.name,
        level: 'model',
      });
    }
  }

  // 5. Decade
  if (filters.yearFrom) {
    segments.push({
      label: `${filters.yearFrom}s`,
      level: 'decade',
    });
  }

  // 6. Collections
  if (filters.collectionIds && filters.collectionIds.length > 0) {
    const collections = filterOptions?.collections?.filter(c => filters.collectionIds?.includes(c.id)) ?? [];
    const collectionNames = collections.map(c => c.name);
    if (collectionNames.length > 0) {
      segments.push({
        label: collectionNames.join(", "),
        level: 'collection',
      });
    }
  }

  // Handle clicking on a breadcrumb level - remove all filters to the right
  const handleBreadcrumbClick = (clickedLevel: string) => {
    const updates: any = {};

    // Define the hierarchy order
    const hierarchy = ['country', 'county', 'make', 'model', 'decade', 'collection'];
    const clickedIndex = hierarchy.indexOf(clickedLevel);

    // Clear all filters that come after the clicked level
    hierarchy.forEach((level, index) => {
      if (index > clickedIndex) {
        switch (level) {
          case 'county':
            updates.counties = undefined;
            break;
          case 'make':
            updates.makeIds = undefined;
            break;
          case 'model':
            updates.modelId = undefined;
            break;
          case 'decade':
            updates.yearFrom = undefined;
            updates.yearTo = undefined;
            break;
          case 'collection':
            updates.collectionIds = undefined;
            break;
        }
      }
    });

    updateFilters(updates);
  };

  // Convert segments to BreadcrumbSegment format with click handlers
  const breadcrumbSegments: BreadcrumbSegment[] = segments.map((segment, index) => {
    const isLast = index === segments.length - 1;
    
    return {
      label: segment.label,
      onClick: isLast ? undefined : () => handleBreadcrumbClick(segment.level),
    };
  });

  return <VehicleBreadcrumbs segments={breadcrumbSegments} />;
}
