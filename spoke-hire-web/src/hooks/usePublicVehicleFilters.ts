"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trackEvent } from "~/lib/analytics";

/**
 * Public Vehicle Filters
 * 
 * Simplified filters for public vehicle catalogue
 * No price, status, search, or admin-specific filters
 */
export interface PublicVehicleFilters {
  // Vehicle attributes
  makeIds?: string[];
  modelId?: string;
  collectionIds?: string[];
  decadeIds?: string[];
  
  // Location filters
  countryIds?: string[];
  counties?: string[];
  
  // Pagination
  page?: number;
  
  // Sorting
  sortBy?: "createdAt" | "updatedAt" | "year" | "name";
  sortOrder?: "asc" | "desc";
  
  // View mode
  viewMode?: "table" | "cards";
}

export interface PublicVehicleFiltersUpdate {
  makeIds?: string[];
  modelId?: string;
  collectionIds?: string[];
  decadeIds?: string[];
  countryIds?: string[];
  counties?: string[];
  page?: number;
  sortBy?: "createdAt" | "updatedAt" | "year" | "name";
  sortOrder?: "asc" | "desc";
  viewMode?: "table" | "cards";
}

/**
 * Hook for managing public vehicle filters with URL persistence
 * 
 * All filter state is stored in URL search params for:
 * - Shareable URLs
 * - Browser back/forward support
 * - Bookmark support
 * - SEO-friendly
 */
export function usePublicVehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Track filter changes with debouncing
  const filterTrackingTimeout = useRef<NodeJS.Timeout>();

  // Parse filters from URL
  const filters = useMemo((): PublicVehicleFilters => {
    const makeIds = searchParams.get("makeIds")?.split(",").filter(Boolean) ?? [];
    const modelId = searchParams.get("modelId") ?? undefined;
    const collectionIds = searchParams.get("collectionIds")?.split(",").filter(Boolean) ?? [];
    const decadeIds = searchParams.get("decadeIds")?.split(",").filter(Boolean) ?? [];
    const countryIds = searchParams.get("countryIds")?.split(",").filter(Boolean) ?? [];
    const counties = searchParams.get("counties")?.split(",").filter(Boolean) ?? [];
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const sortBy = (searchParams.get("sortBy") ?? "createdAt") as PublicVehicleFilters["sortBy"];
    const sortOrder = (searchParams.get("sortOrder") ?? "desc") as PublicVehicleFilters["sortOrder"];
    const viewMode = (searchParams.get("viewMode") ?? "cards") as PublicVehicleFilters["viewMode"];

    return {
      makeIds: makeIds.length > 0 ? makeIds : undefined,
      modelId,
      collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
      decadeIds: decadeIds.length > 0 ? decadeIds : undefined,
      countryIds: countryIds.length > 0 ? countryIds : undefined,
      counties: counties.length > 0 ? counties : undefined,
      page,
      sortBy,
      sortOrder,
      viewMode,
    };
  }, [searchParams]);
  
  // Track vehicle search when filters change (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (filterTrackingTimeout.current) {
      clearTimeout(filterTrackingTimeout.current);
    }
    
    // Only track if there are active filters (not just defaults)
    const hasFilters = !!(
      filters.makeIds?.length ||
      filters.modelId ||
      filters.collectionIds?.length ||
      filters.decadeIds?.length ||
      filters.countryIds?.length ||
      filters.counties?.length
    );
    
    if (hasFilters) {
      // Debounce tracking by 1 second
      filterTrackingTimeout.current = setTimeout(() => {
        trackEvent('vehicle_search', {
          makeIds: filters.makeIds,
          modelId: filters.modelId,
          decadeIds: filters.decadeIds,
          collectionIds: filters.collectionIds,
          countryIds: filters.countryIds,
          counties: filters.counties,
          filterCount: [
            filters.makeIds?.length ?? 0,
            filters.modelId ? 1 : 0,
            filters.collectionIds?.length ?? 0,
            filters.decadeIds?.length ?? 0,
            filters.countryIds?.length ?? 0,
            filters.counties?.length ?? 0,
          ].reduce((a, b) => a + b, 0),
        });
      }, 1000);
    }
    
    // Cleanup on unmount
    return () => {
      if (filterTrackingTimeout.current) {
        clearTimeout(filterTrackingTimeout.current);
      }
    };
  }, [filters]);

  // Update filters and URL
  const updateFilters = useCallback(
    (updates: PublicVehicleFiltersUpdate) => {
      const params = new URLSearchParams(searchParams.toString());

      // Apply updates
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || 
            (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      });

      // Reset to page 1 when filters change (except when explicitly updating page)
      if (!("page" in updates)) {
        params.set("page", "1");
      }

      // Update URL
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push("/vehicles", { scroll: false });
  }, [router]);

  // Check if any filters are active (excluding defaults)
  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.makeIds && filters.makeIds.length > 0) ||
      filters.modelId ||
      (filters.collectionIds && filters.collectionIds.length > 0) ||
      (filters.decadeIds && filters.decadeIds.length > 0) ||
      (filters.countryIds && filters.countryIds.length > 0) ||
      (filters.counties && filters.counties.length > 0) ||
      (filters.sortBy && filters.sortBy !== "createdAt") ||
      (filters.sortOrder && filters.sortOrder !== "desc")
    );
  }, [filters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
}

