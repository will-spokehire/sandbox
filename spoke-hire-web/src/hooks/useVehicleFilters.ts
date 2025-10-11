"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { VehicleStatus } from "@prisma/client";

export interface VehicleFilters {
  search?: string;
  status?: VehicleStatus | "ALL";
  makeIds?: string[];
  modelId?: string;
  collectionIds?: string[];
  exteriorColors?: string[];
  interiorColors?: string[];
  yearFrom?: string;
  yearTo?: string;
  numberOfSeats?: number[];
  gearboxTypes?: string[];
  steeringIds?: string[];
  countryIds?: string[];
  counties?: string[];
  postcode?: string;
  maxDistance?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  sortByDistance?: boolean;
  viewMode?: "table" | "cards";
  page?: number;
}

export interface VehicleFiltersUpdate {
  search?: string;
  status?: VehicleStatus | "ALL";
  makeIds?: string[];
  modelId?: string;
  collectionIds?: string[];
  exteriorColors?: string[];
  interiorColors?: string[];
  yearFrom?: string;
  yearTo?: string;
  numberOfSeats?: number[];
  gearboxTypes?: string[];
  steeringIds?: string[];
  countryIds?: string[];
  counties?: string[];
  postcode?: string;
  maxDistance?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  sortByDistance?: boolean;
  viewMode?: "table" | "cards";
  page?: number;
}

/**
 * Hook for managing vehicle filters with URL state synchronization
 * 
 * This hook provides a clean interface for reading and updating vehicle filters
 * while keeping the URL as the single source of truth. All filter changes
 * are automatically reflected in the URL and can be shared/bookmarked.
 * 
 * @example
 * ```tsx
 * const { filters, updateFilters, clearFilters } = useVehicleFilters();
 * 
 * // Update a single filter
 * updateFilters({ search: "BMW" });
 * 
 * // Update multiple filters
 * updateFilters({ 
 *   makeIds: ["bmw-id"], 
 *   status: "PUBLISHED",
 *   page: 1 
 * });
 * 
 * // Clear all filters
 * clearFilters();
 * ```
 */
export function useVehicleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read all current filters from URL
  const filters: VehicleFilters = {
    search: searchParams.get("search") ?? "",
    status: (searchParams.get("status") as VehicleStatus | "ALL" | null) ?? "PUBLISHED",
    makeIds: searchParams.get("makeIds")?.split(",").filter(Boolean) ?? [],
    modelId: searchParams.get("modelId") ?? undefined,
    collectionIds: searchParams.get("collectionIds")?.split(",").filter(Boolean) ?? [],
    exteriorColors: searchParams.get("exteriorColors")?.split(",").filter(Boolean) ?? [],
    interiorColors: searchParams.get("interiorColors")?.split(",").filter(Boolean) ?? [],
    yearFrom: searchParams.get("yearFrom") ?? undefined,
    yearTo: searchParams.get("yearTo") ?? undefined,
    numberOfSeats: searchParams.get("numberOfSeats")?.split(",").filter(Boolean).map(Number) ?? [],
    gearboxTypes: searchParams.get("gearboxTypes")?.split(",").filter(Boolean) ?? [],
    steeringIds: searchParams.get("steeringIds")?.split(",").filter(Boolean) ?? [],
    countryIds: searchParams.get("countryIds")?.split(",").filter(Boolean) ?? [],
    counties: searchParams.get("counties")?.split(",").filter(Boolean) ?? [],
    postcode: searchParams.get("postcode") ?? undefined,
    maxDistance: searchParams.get("maxDistance") ? parseInt(searchParams.get("maxDistance")!) : undefined,
    sortBy: searchParams.get("sortBy") ?? "createdAt",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
    sortByDistance: searchParams.get("sortByDistance") === "true" || searchParams.get("sortBy") === "distance",
    viewMode: (searchParams.get("viewMode") as "table" | "cards") ?? "table",
    page: parseInt(searchParams.get("page") ?? "1", 10),
  };

  /**
   * Update URL with new filter values
   * This is the key function - all state changes go through URL updates
   */
  const updateFilters = useCallback((updates: VehicleFiltersUpdate) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }
    
    if ("status" in updates) {
      if (updates.status && updates.status !== "PUBLISHED") {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }
    
    if (updates.makeIds !== undefined) {
      if (updates.makeIds.length > 0) {
        params.set("makeIds", updates.makeIds.join(","));
      } else {
        params.delete("makeIds");
      }
    }
    
    if ("modelId" in updates) {
      if (updates.modelId) {
        params.set("modelId", updates.modelId);
      } else {
        params.delete("modelId");
      }
    }
    
    if (updates.collectionIds !== undefined) {
      if (updates.collectionIds.length > 0) {
        params.set("collectionIds", updates.collectionIds.join(","));
      } else {
        params.delete("collectionIds");
      }
    }
    
    if (updates.exteriorColors !== undefined) {
      if (updates.exteriorColors.length > 0) {
        params.set("exteriorColors", updates.exteriorColors.join(","));
      } else {
        params.delete("exteriorColors");
      }
    }
    
    if (updates.interiorColors !== undefined) {
      if (updates.interiorColors.length > 0) {
        params.set("interiorColors", updates.interiorColors.join(","));
      } else {
        params.delete("interiorColors");
      }
    }
    
    if ("yearFrom" in updates) {
      if (updates.yearFrom) {
        params.set("yearFrom", updates.yearFrom);
      } else {
        params.delete("yearFrom");
      }
    }
    
    if ("yearTo" in updates) {
      if (updates.yearTo) {
        params.set("yearTo", updates.yearTo);
      } else {
        params.delete("yearTo");
      }
    }
    
    if (updates.numberOfSeats !== undefined) {
      if (updates.numberOfSeats.length > 0) {
        params.set("numberOfSeats", updates.numberOfSeats.join(","));
      } else {
        params.delete("numberOfSeats");
      }
    }
    
    if (updates.gearboxTypes !== undefined) {
      if (updates.gearboxTypes.length > 0) {
        params.set("gearboxTypes", updates.gearboxTypes.join(","));
      } else {
        params.delete("gearboxTypes");
      }
    }
    
    if (updates.steeringIds !== undefined) {
      if (updates.steeringIds.length > 0) {
        params.set("steeringIds", updates.steeringIds.join(","));
      } else {
        params.delete("steeringIds");
      }
    }
    
    if (updates.countryIds !== undefined) {
      if (updates.countryIds.length > 0) {
        params.set("countryIds", updates.countryIds.join(","));
      } else {
        params.delete("countryIds");
      }
    }
    
    if (updates.counties !== undefined) {
      if (updates.counties.length > 0) {
        params.set("counties", updates.counties.join(","));
      } else {
        params.delete("counties");
      }
    }
    
    if ("postcode" in updates) {
      if (updates.postcode) {
        params.set("postcode", updates.postcode);
      } else {
        params.delete("postcode");
      }
    }
    
    if ("maxDistance" in updates) {
      if (updates.maxDistance) {
        params.set("maxDistance", updates.maxDistance.toString());
      } else {
        params.delete("maxDistance");
      }
    }
    
    if (updates.sortBy !== undefined) {
      if (updates.sortBy !== "createdAt") {
        params.set("sortBy", updates.sortBy);
      } else {
        params.delete("sortBy");
      }
    }
    
    if (updates.sortOrder !== undefined) {
      if (updates.sortOrder !== "desc") {
        params.set("sortOrder", updates.sortOrder);
      } else {
        params.delete("sortOrder");
      }
    }
    
    if (updates.sortByDistance !== undefined) {
      if (updates.sortByDistance) {
        params.set("sortByDistance", "true");
      } else {
        params.delete("sortByDistance");
      }
    }
    
    if (updates.viewMode !== undefined) {
      if (updates.viewMode !== "table") {
        params.set("viewMode", updates.viewMode);
      } else {
        params.delete("viewMode");
      }
    }
    
    if (updates.page !== undefined) {
      if (updates.page > 1) {
        params.set("page", updates.page.toString());
      } else {
        params.delete("page");
      }
    }

    // When filters change, reset to page 1 unless page is explicitly set
    const isFilterChange = updates.search !== undefined || updates.status !== undefined || 
                          updates.makeIds !== undefined || updates.modelId !== undefined ||
                          updates.collectionIds !== undefined || updates.exteriorColors !== undefined ||
                          updates.interiorColors !== undefined || updates.yearFrom !== undefined ||
                          updates.yearTo !== undefined || updates.numberOfSeats !== undefined ||
                          updates.gearboxTypes !== undefined || updates.steeringIds !== undefined ||
                          updates.postcode !== undefined || updates.maxDistance !== undefined;
    
    if (isFilterChange && updates.page === undefined) {
      params.delete("page"); // Reset to page 1 when filters change
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/vehicles";
    router.push(newUrl, { scroll: false });
  }, [searchParams, router]);

  /**
   * Clear all filters and reset to default state
   */
  const clearFilters = useCallback(() => {
    router.push("/admin/vehicles?status=PUBLISHED", { scroll: false });
  }, [router]);

  /**
   * Check if any filters are active (excluding default PUBLISHED status)
   */
  const hasActiveFilters = !!(
    filters.search ||
    (filters.status && filters.status !== "PUBLISHED") ||
    (filters.makeIds && filters.makeIds.length > 0) ||
    filters.modelId ||
    (filters.collectionIds && filters.collectionIds.length > 0) ||
    (filters.exteriorColors && filters.exteriorColors.length > 0) ||
    (filters.interiorColors && filters.interiorColors.length > 0) ||
    filters.yearFrom ||
    filters.yearTo ||
    (filters.numberOfSeats && filters.numberOfSeats.length > 0) ||
    (filters.gearboxTypes && filters.gearboxTypes.length > 0) ||
    (filters.steeringIds && filters.steeringIds.length > 0) ||
    (filters.countryIds && filters.countryIds.length > 0) ||
    (filters.counties && filters.counties.length > 0) ||
    filters.postcode ||
    filters.maxDistance
  );

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
  };
}
