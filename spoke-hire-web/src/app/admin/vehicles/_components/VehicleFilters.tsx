"use client";

import { useState } from "react";
import type { VehicleStatus } from "@prisma/client";
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
  numberOfSeats?: number[];
  gearboxTypes?: string[];
  steeringIds?: string[];
  countryIds?: string[];
  counties?: string[];
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
  onNumberOfSeatsChange: (seats: number[]) => void;
  onGearboxTypesChange: (types: string[]) => void;
  onSteeringIdsChange: (ids: string[]) => void;
  onCountryIdsChange: (ids: string[]) => void;
  onCountiesChange: (counties: string[]) => void;
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
  numberOfSeats = [],
  gearboxTypes = [],
  steeringIds = [],
  countryIds = [],
  counties = [],
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
  onNumberOfSeatsChange,
  onGearboxTypesChange,
  onSteeringIdsChange,
  onCountryIdsChange,
  onCountiesChange,
  onPostcodeChange,
  onMaxDistanceChange,
  onPostcodeAndDistanceChange,
  onSortChange,
  onClearFilters,
}: VehicleFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasActiveFilters = !!(
    (search ?? "") ||
    (status !== undefined) ||
    makeIds.length > 0 ||
    (modelId ?? "") ||
    collectionIds.length > 0 ||
    exteriorColors.length > 0 ||
    interiorColors.length > 0 ||
    (yearFrom ?? "") ||
    (yearTo ?? "") ||
    numberOfSeats.length > 0 ||
    gearboxTypes.length > 0 ||
    steeringIds.length > 0 ||
    countryIds.length > 0 ||
    counties.length > 0 ||
    (postcode ?? "") ||
    (maxDistance ?? 0)
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
    numberOfSeats.length +
    gearboxTypes.length +
    steeringIds.length +
    countryIds.length +
    counties.length +
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
              numberOfSeats={numberOfSeats}
              gearboxTypes={gearboxTypes}
              steeringIds={steeringIds}
              countryIds={countryIds}
              counties={counties}
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
              onNumberOfSeatsChange={onNumberOfSeatsChange}
              onGearboxTypesChange={onGearboxTypesChange}
              onSteeringIdsChange={onSteeringIdsChange}
              onCountryIdsChange={onCountryIdsChange}
              onCountiesChange={onCountiesChange}
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
              numberOfSeats={numberOfSeats}
              gearboxTypes={gearboxTypes}
              steeringIds={steeringIds}
              countryIds={countryIds}
              counties={counties}
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
              onNumberOfSeatsChange={onNumberOfSeatsChange}
              onGearboxTypesChange={onGearboxTypesChange}
              onSteeringIdsChange={onSteeringIdsChange}
              onCountryIdsChange={onCountryIdsChange}
              onCountiesChange={onCountiesChange}
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
