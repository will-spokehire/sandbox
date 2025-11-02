"use client";

import { useMemo } from "react";
import { api } from "~/trpc/react";
import type { PublicVehicleFilters } from "./usePublicVehicleFilters";

/**
 * Hook to generate dynamic page titles (H1 and H2) based on active filters
 * 
 * H1: Geography, Cars, "for Hire"
 * H2: Tags/Collections, Decades
 * 
 * Examples:
 * H1: "Classic Vehicles for Hire"
 * H2: "Discover Our Collection"
 * 
 * H1: "Ferrari & Porsche for Hire in United Kingdom"
 * H2: "From the 1980s"
 * 
 * H1: "Ferrari 488 GTB for Hire in Surrey, United Kingdom"
 * H2: "Classic Collection • Exotic Collection • From the 2010s"
 */
export function usePublicVehiclePageTitle(filters: PublicVehicleFilters) {
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
      enabled: !!(
        filters.makeIds?.length ||
        filters.modelId ||
        filters.collectionIds?.length ||
        filters.yearFrom ||
        filters.countryIds?.length ||
        filters.counties?.length
      ),
    }
  );

  const titles = useMemo(() => {
    let h1 = "";
    let h2 = "";

    // ========================================
    // H1: Geography + Cars + "for Hire"
    // ========================================
    const h1Parts: string[] = [];

    // 1. Vehicle/Make/Model info
    if (filters.makeIds && filters.makeIds.length > 0) {
      const makes = filterOptions?.makes?.filter(m => filters.makeIds?.includes(m.id)) ?? [];
      const makeNames = makes.map(m => m.name);
      
      if (makeNames.length > 0) {
        if (filters.modelId) {
          // Make + Model
          const model = filterOptions?.models?.find(m => m.id === filters.modelId);
          if (model) {
            h1Parts.push(`${makeNames.join(" & ")} ${model.name}`);
          } else {
            h1Parts.push(makeNames.join(" & "));
          }
        } else {
          // Just Make(s)
          h1Parts.push(makeNames.join(" & "));
        }
      }
    } else {
      // No specific make - use generic
      h1Parts.push("Classic Vehicles");
    }

    // 2. Add "for Hire"
    h1Parts.push("for Hire");

    // 3. Add Location (Geography)
    const locationParts: string[] = [];
    
    if (filters.counties && filters.counties.length > 0) {
      locationParts.push(filters.counties.join(", "));
    }
    
    if (filters.countryIds && filters.countryIds.length > 0) {
      const countries = filterOptions?.countries?.filter(c => filters.countryIds?.includes(c.id)) ?? [];
      const countryNames = countries.map(c => c.name);
      if (countryNames.length > 0) {
        locationParts.push(countryNames.join(", "));
      }
    }

    if (locationParts.length > 0) {
      h1Parts.push(`in ${locationParts.join(", ")}`);
    }

    h1 = h1Parts.join(" ");

    // ========================================
    // H2: SEO-friendly subtitle/description
    // ========================================
    const h2Parts: string[] = [];
    const collectionNames: string[] = [];
    let hasDecade = false;

    // 1. Collections/Tags
    if (filters.collectionIds && filters.collectionIds.length > 0) {
      const collections = filterOptions?.collections?.filter(c => filters.collectionIds?.includes(c.id)) ?? [];
      collectionNames.push(...collections.map(c => c.name));
    }

    // 2. Decade
    if (filters.yearFrom) {
      hasDecade = true;
    }

    // Build H2 based on what filters are active
    if (collectionNames.length > 0 && hasDecade) {
      // Collections + Decade: "Explore our Classic & Exotic Collection vehicles from the 1980s"
      h2 = `Explore our ${collectionNames.join(" & ")} vehicles from the ${filters.yearFrom}s`;
    } else if (collectionNames.length > 0) {
      // Just Collections: "Browse our Classic & Exotic Collection vehicles"
      h2 = `Browse our ${collectionNames.join(" & ")} vehicles`;
    } else if (hasDecade) {
      // Just Decade: "Discover vintage vehicles from the 1980s"
      h2 = `Discover vintage vehicles from the ${filters.yearFrom}s`;
    } else if (filters.makeIds && filters.makeIds.length > 0) {
      // Has Make but no collections/decade
      const makes = filterOptions?.makes?.filter(m => filters.makeIds?.includes(m.id)) ?? [];
      const makeNames = makes.map(m => m.name);
      if (makeNames.length > 0) {
        if (filters.modelId) {
          // Make + Model: "Premium Ferrari 488 GTB available for your special occasion"
          const model = filterOptions?.models?.find(m => m.id === filters.modelId);
          h2 = `Premium ${makeNames.join(" & ")} ${model?.name ?? ''} available for your special occasion`;
        } else if (makeNames.length === 1) {
          // Single Make: "Discover our collection of Ferrari vehicles"
          h2 = `Discover our collection of ${makeNames[0]} vehicles`;
        } else {
          // Multiple Makes: "Premium Ferrari & Porsche vehicles available"
          h2 = `Premium ${makeNames.join(" & ")} vehicles available`;
        }
      } else {
        h2 = "Discover meticulously maintained classic and vintage vehicles";
      }
    } else if (locationParts.length > 0) {
      // Location only: "Classic vehicles available in your area"
      h2 = "Classic and vintage vehicles available in your area";
    } else {
      // Default: No filters
      h2 = "Discover meticulously maintained classic and vintage vehicles for your special occasions";
    }

    return { h1, h2 };
  }, [filters, filterOptions]);

  return titles;
}

