"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { useVehicleFiltersContext } from "~/contexts";
import {
  SearchInput,
  MobileFilters,
  DesktopFilters,
  FilterGrid,
} from "./filters";

/**
 * Vehicle Filters
 * 
 * Search and filter controls for vehicle list
 * Mobile-first design with collapsible filters
 * Now uses context to eliminate props drilling
 */
export function VehicleFilters() {
  const { filters, updateFilters, clearFilters } = useVehicleFiltersContext();
  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Count active non-search filters for badge
  const activeFilterCount =
    (filters.status && filters.status !== "PUBLISHED" ? 1 : 0) +
    (filters.makeIds?.length ?? 0) +
    (filters.modelId ? 1 : 0) +
    (filters.collectionIds?.length ?? 0) +
    (filters.exteriorColors?.length ?? 0) +
    (filters.interiorColors?.length ?? 0) +
    (filters.yearFrom ? 1 : 0) +
    (filters.yearTo ? 1 : 0) +
    (filters.numberOfSeats?.length ?? 0) +
    (filters.gearboxTypes?.length ?? 0) +
    (filters.steeringIds?.length ?? 0) +
    (filters.countryIds?.length ?? 0) +
    (filters.counties?.length ?? 0) +
    (filters.postcode ? 1 : 0) +
    (filters.maxDistance ? 1 : 0);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    updateFilters({ search: value });
  };

  const handleClearFilters = () => {
    setSearchInput("");
    clearFilters();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search - Always visible */}
          <SearchInput
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search vehicles, owners..."
          />

          {/* Mobile: Collapsible Filters */}
          <MobileFilters
            filtersOpen={filtersOpen}
            onToggle={setFiltersOpen}
            activeCount={activeFilterCount}
          >
            <FilterGrid />
          </MobileFilters>

          {/* Desktop: Always visible filters */}
          <DesktopFilters>
            <FilterGrid />
          </DesktopFilters>
        </div>
      </CardContent>
    </Card>
  );
}
