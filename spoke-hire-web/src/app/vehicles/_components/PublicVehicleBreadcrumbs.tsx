"use client";

import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePublicVehicleFiltersContext } from "~/contexts/PublicVehicleFiltersContext";
import { api } from "~/trpc/react";

/**
 * Public Vehicle Breadcrumbs
 * 
 * Displays active filters as a cumulative breadcrumb path:
 * Home > Country > County > Make > Model > Decade > Collections
 * 
 * Each level is clickable - clicking removes all filters to the right.
 */
export function PublicVehicleBreadcrumbs() {
  const { filters, updateFilters } = usePublicVehicleFiltersContext();

  // Fetch current filter options to get names for IDs
  const { data: filterOptions } = api.publicVehicle.getFilterOptions.useQuery(
    {
      makeIds: filters.makeIds,
      modelId: filters.modelId,
      collectionIds: filters.collectionIds,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      countryIds: filters.countryIds,
      counties: filters.counties,
    },
    {
      staleTime: 30000,
    }
  );

  // Build breadcrumb segments in hierarchical order with their filter level
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

  // Note: City would go here when implemented

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

  // Don't show breadcrumbs if no filters are active
  if (segments.length === 0) {
    return null;
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

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {/* Home */}
        <li className="flex items-center gap-2">
          <Link 
            href="/vehicles" 
            className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Vehicles</span>
          </Link>
        </li>

        {/* All filter segments */}
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              {isLast ? (
                // Last segment - not clickable
                <span className="font-medium text-foreground">
                  {segment.label}
                </span>
              ) : (
                // Intermediate segments - clickable to remove filters to the right
                <button
                  onClick={() => handleBreadcrumbClick(segment.level)}
                  className="font-medium text-foreground hover:text-primary hover:underline transition-colors cursor-pointer"
                  title={`Keep only filters up to ${segment.label}`}
                >
                  {segment.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

