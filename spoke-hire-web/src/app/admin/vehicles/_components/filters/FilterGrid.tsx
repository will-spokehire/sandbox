"use client";

import { VehicleStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { SingleSelectFilter } from "./SingleSelectFilter";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { YearRangeFilter } from "./YearRangeFilter";
import { FilterActions } from "./FilterActions";
import { DistanceFilter } from "./DistanceFilter";
import { SortFilter } from "./SortFilter";
import type { FilterOption } from "./types";

interface FilterGridProps {
  // Filter values
  status?: VehicleStatus;
  makeIds: string[];
  modelId?: string;
  collectionIds: string[];
  exteriorColors: string[];
  interiorColors: string[];
  yearFrom?: string;
  yearTo?: string;
  numberOfSeats: number[];
  gearboxTypes: string[];
  steeringIds: string[];
  countryIds: string[];
  counties: string[];
  postcode?: string;
  maxDistance?: number;
  sortBy: string;
  sortOrder: "asc" | "desc";
  hasActiveFilters: boolean;
  
  // Handlers
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
 * Filter Grid
 * 
 * Contains all individual filter controls
 */
export function FilterGrid({
  status,
  makeIds,
  modelId,
  collectionIds,
  exteriorColors,
  interiorColors,
  yearFrom,
  yearTo,
  numberOfSeats,
  gearboxTypes,
  steeringIds,
  countryIds,
  counties,
  postcode,
  maxDistance,
  sortBy,
  sortOrder,
  hasActiveFilters,
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
}: FilterGridProps) {
  // Fetch filter options with caching (server-side cache + client staleTime)
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - matches server cache TTL
  });

  // Fetch models when single make is selected
  const { data: models } = api.vehicle.getModelsByMake.useQuery(
    { makeId: makeIds[0]! },
    { 
      enabled: makeIds.length === 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Transform filter options to FilterOption format
  const makeOptions: FilterOption[] =
    filterOptions?.makes.map((make: { id: string; name: string }) => ({
      id: make.id,
      name: make.name,
    })) ?? [];

  const collectionOptions: FilterOption[] =
    filterOptions?.collections.map((collection: { id: string; name: string; color: string | null }) => ({
      id: collection.id,
      name: collection.name,
      color: collection.color ?? undefined,
    })) ?? [];

  const exteriorColorOptions: FilterOption[] =
    filterOptions?.exteriorColors.map((color: string) => ({
      id: color,
      name: color,
    })) ?? [];

  const interiorColorOptions: FilterOption[] =
    filterOptions?.interiorColors.map((color: string) => ({
      id: color,
      name: color,
    })) ?? [];

  const modelOptions =
    models?.map((model: { id: string; name: string }) => ({
      value: model.id,
      label: model.name,
    })) ?? [];

  const seatsOptions: FilterOption[] =
    filterOptions?.seats.map((seats: number) => ({
      id: seats.toString(),
      name: `${seats} seats`,
    })) ?? [];

  const gearboxOptions: FilterOption[] =
    filterOptions?.gearboxTypes.map((type: string) => ({
      id: type,
      name: type,
    })) ?? [];

  const steeringOptions: FilterOption[] =
    filterOptions?.steeringTypes.map((steering: { id: string; name: string }) => ({
      id: steering.id,
      name: steering.name,
    })) ?? [];

  const countryOptions: FilterOption[] =
    filterOptions?.countries.map((country: { id: string; name: string; code: string | null }) => ({
      id: country.id,
      name: country.name,
    })) ?? [];

  const countyOptions: FilterOption[] =
    filterOptions?.counties.map((county: string) => ({
      id: county,
      name: county,
    })) ?? [];

  const handleStatusChange = (value?: string) => {
    // Convert empty string to undefined for "All Status"
    onStatusChange(value && value !== "" ? (value as VehicleStatus) : undefined);
  };

  const handleModelChange = (value?: string) => {
    // Clear model if no makes or multiple makes selected
    if (makeIds.length !== 1) {
      onModelChange(undefined);
    } else {
      onModelChange(value);
    }
  };

  // Custom render for collection options (with color indicator)
  const renderCollectionOption = (option: FilterOption, selected: boolean) => (
    <>
      <Check
        className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")}
      />
      {option.color && (
        <div
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: option.color }}
        />
      )}
      {option.name}
    </>
  );

  // Custom render for standard multi-select options
  const renderStandardOption = (option: FilterOption, selected: boolean) => (
    <>
      <Check
        className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")}
      />
      {option.name}
    </>
  );

  return (
    <>
      {/* Status Filter */}
      <SingleSelectFilter
        label="All Status"
        value={status ?? ""}
        options={[
          { value: "", label: "All Status" },
          { value: "DRAFT", label: "Draft" },
          { value: "PUBLISHED", label: "Published" },
          { value: "DECLINED", label: "Declined" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        onChange={handleStatusChange}
        placeholder="All Status"
        className="md:w-[160px]"
      />

      {/* Make Filter */}
      <MultiSelectFilter
        label="Select Makes"
        placeholder="Select makes..."
        options={makeOptions}
        selectedIds={makeIds}
        onChange={onMakeIdsChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search makes..."
        className="md:w-[200px]"
      />

      {/* Model Filter */}
      <SingleSelectFilter
        label="All Models"
        value={modelId}
        options={modelOptions}
        onChange={handleModelChange}
        placeholder="Model"
        disabled={makeIds.length !== 1}
        className="md:w-[160px]"
      />

      {/* Collection Filter */}
      <MultiSelectFilter
        label="Select Collections"
        placeholder="Select collections..."
        options={collectionOptions}
        selectedIds={collectionIds}
        onChange={onCollectionIdsChange}
        renderOption={renderCollectionOption}
        searchPlaceholder="Search collections..."
        className="md:w-[200px]"
      />

      {/* Exterior Color Filter */}
      <MultiSelectFilter
        label="Select Exterior Colors"
        placeholder="Exterior colors..."
        options={exteriorColorOptions}
        selectedIds={exteriorColors}
        onChange={onExteriorColorsChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search colors..."
        className="md:w-[180px]"
      />

      {/* Interior Color Filter */}
      <MultiSelectFilter
        label="Select Interior Colors"
        placeholder="Interior colors..."
        options={interiorColorOptions}
        selectedIds={interiorColors}
        onChange={onInteriorColorsChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search colors..."
        className="md:w-[180px]"
      />

      {/* Year Range Filter */}
      <YearRangeFilter
        yearFrom={yearFrom}
        yearTo={yearTo}
        onYearFromChange={onYearFromChange}
        onYearToChange={onYearToChange}
      />

      {/* Number of Seats Filter */}
      <MultiSelectFilter
        label="Select Seats"
        placeholder="Seats..."
        options={seatsOptions}
        selectedIds={numberOfSeats.map(String)}
        onChange={(ids) => onNumberOfSeatsChange(ids.map(Number))}
        renderOption={renderStandardOption}
        searchPlaceholder="Search seats..."
        className="md:w-[150px]"
      />

      {/* Gearbox Filter */}
      <MultiSelectFilter
        label="Select Gearbox"
        placeholder="Gearbox..."
        options={gearboxOptions}
        selectedIds={gearboxTypes}
        onChange={onGearboxTypesChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search gearbox..."
        className="md:w-[150px]"
      />

      {/* Steering Filter */}
      <MultiSelectFilter
        label="Select Steering"
        placeholder="Steering..."
        options={steeringOptions}
        selectedIds={steeringIds}
        onChange={onSteeringIdsChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search steering..."
        className="md:w-[180px]"
      />

      {/* Country Filter */}
      <MultiSelectFilter
        label="Select Countries"
        placeholder="Countries..."
        options={countryOptions}
        selectedIds={countryIds}
        onChange={onCountryIdsChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search countries..."
        className="md:w-[180px]"
      />

      {/* County Filter */}
      <MultiSelectFilter
        label="Select Counties"
        placeholder="Counties..."
        options={countyOptions}
        selectedIds={counties}
        onChange={onCountiesChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search counties..."
        className="md:w-[180px]"
      />

      {/* Distance Filter */}
              <DistanceFilter
                postcode={postcode}
                maxDistance={maxDistance}
                onPostcodeChange={onPostcodeChange}
                onMaxDistanceChange={onMaxDistanceChange}
                onPostcodeAndDistanceChange={onPostcodeAndDistanceChange}
              />

      {/* Sort Filter */}
      <SortFilter
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={onSortChange}
        hasDistanceFilter={!!postcode && !!maxDistance}
      />

      {/* Clear Filters */}
      <FilterActions
        hasActiveFilters={hasActiveFilters}
        onClear={onClearFilters}
      />
    </>
  );
}

