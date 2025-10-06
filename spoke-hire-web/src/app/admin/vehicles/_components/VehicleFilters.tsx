"use client";

import { useState } from "react";
import { VehicleStatus } from "@prisma/client";
import { Card, CardContent } from "~/components/ui/card";
import {
  SearchInput,
  MobileFilters,
  DesktopFilters,
  FilterGrid,
} from "./filters";

interface VehicleFiltersProps {
  search?: string;
  status?: VehicleStatus;
  makeIds?: string[];
  modelId?: string;
  collectionIds?: string[];
  exteriorColors?: string[];
  interiorColors?: string[];
  yearFrom?: string;
  yearTo?: string;
  postcode?: string;
  maxDistance?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSearchChange: (search: string) => void;
  onStatusChange: (status?: VehicleStatus) => void;
  onMakeIdsChange: (makeIds: string[]) => void;
  onModelChange: (modelId?: string) => void;
  onCollectionIdsChange: (collectionIds: string[]) => void;
  onExteriorColorsChange: (colors: string[]) => void;
  onInteriorColorsChange: (colors: string[]) => void;
  onYearFromChange: (year?: string) => void;
  onYearToChange: (year?: string) => void;
  onPostcodeChange: (postcode: string) => void;
  onMaxDistanceChange: (distance?: number) => void;
  onPostcodeAndDistanceChange?: (postcode: string, distance: number) => void;
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  onClearFilters: () => void;
}

/**
 * Vehicle Filters
 * 
 * Search and filter controls for vehicle list
 * Mobile-first design with collapsible filters
 */
export function VehicleFilters({
  search = "",
  status,
  makeIds = [],
  modelId,
  collectionIds = [],
  exteriorColors = [],
  interiorColors = [],
  yearFrom,
  yearTo,
  postcode,
  maxDistance,
  sortBy = "createdAt",
  sortOrder = "desc",
  onSearchChange,
  onStatusChange,
  onMakeIdsChange,
  onModelChange,
  onCollectionIdsChange,
  onExteriorColorsChange,
  onInteriorColorsChange,
  onYearFromChange,
  onYearToChange,
  onPostcodeChange,
  onMaxDistanceChange,
  onPostcodeAndDistanceChange,
  onSortChange,
  onClearFilters,
}: VehicleFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = !!(
    search ||
    status ||
    makeIds.length > 0 ||
    modelId ||
    collectionIds.length > 0 ||
    exteriorColors.length > 0 ||
    interiorColors.length > 0 ||
    yearFrom ||
    yearTo ||
    postcode ||
    maxDistance
  );

  // Count active non-search filters for badge
  const activeFilterCount =
    (status ? 1 : 0) +
    makeIds.length +
    (modelId ? 1 : 0) +
    collectionIds.length +
    exteriorColors.length +
    interiorColors.length +
    (yearFrom ? 1 : 0) +
    (yearTo ? 1 : 0) +
    (postcode ? 1 : 0) +
    (maxDistance ? 1 : 0);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onSearchChange(value);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onClearFilters();
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
            <FilterGrid
              status={status}
              makeIds={makeIds}
              modelId={modelId}
              collectionIds={collectionIds}
              exteriorColors={exteriorColors}
              interiorColors={interiorColors}
              yearFrom={yearFrom}
              yearTo={yearTo}
              postcode={postcode}
              maxDistance={maxDistance}
              sortBy={sortBy}
              sortOrder={sortOrder}
              hasActiveFilters={hasActiveFilters}
              onStatusChange={onStatusChange}
              onMakeIdsChange={onMakeIdsChange}
              onModelChange={onModelChange}
              onCollectionIdsChange={onCollectionIdsChange}
              onExteriorColorsChange={onExteriorColorsChange}
              onInteriorColorsChange={onInteriorColorsChange}
              onYearFromChange={onYearFromChange}
              onYearToChange={onYearToChange}
              onPostcodeChange={onPostcodeChange}
              onMaxDistanceChange={onMaxDistanceChange}
              onPostcodeAndDistanceChange={onPostcodeAndDistanceChange}
              onSortChange={onSortChange}
              onClearFilters={handleClearFilters}
            />
          </MobileFilters>

          {/* Desktop: Always visible filters */}
          <DesktopFilters>
            <FilterGrid
              status={status}
              makeIds={makeIds}
              modelId={modelId}
              collectionIds={collectionIds}
              exteriorColors={exteriorColors}
              interiorColors={interiorColors}
              yearFrom={yearFrom}
              yearTo={yearTo}
              postcode={postcode}
              maxDistance={maxDistance}
              sortBy={sortBy}
              sortOrder={sortOrder}
              hasActiveFilters={hasActiveFilters}
              onStatusChange={onStatusChange}
              onMakeIdsChange={onMakeIdsChange}
              onModelChange={onModelChange}
              onCollectionIdsChange={onCollectionIdsChange}
              onExteriorColorsChange={onExteriorColorsChange}
              onInteriorColorsChange={onInteriorColorsChange}
              onYearFromChange={onYearFromChange}
              onYearToChange={onYearToChange}
              onPostcodeChange={onPostcodeChange}
              onMaxDistanceChange={onMaxDistanceChange}
              onPostcodeAndDistanceChange={onPostcodeAndDistanceChange}
              onSortChange={onSortChange}
              onClearFilters={handleClearFilters}
            />
          </DesktopFilters>
        </div>
      </CardContent>
    </Card>
  );
}
