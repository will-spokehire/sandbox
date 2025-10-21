"use client";

import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { useVehicleFiltersContext } from "~/contexts";
import { SingleSelectFilter } from "./SingleSelectFilter";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { YearRangeFilter } from "./YearRangeFilter";
import { FilterActions } from "./FilterActions";
import { DistanceFilter } from "./DistanceFilter";
import { SortFilter } from "./SortFilter";
import type { FilterOption } from "./types";
import type { FilterOptions, ModelsByMake } from "~/types/vehicle";


/**
 * Filter Grid
 * 
 * Contains all individual filter controls
 * Now uses context to eliminate props drilling
 */
export function FilterGrid() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useVehicleFiltersContext();
  // Fetch filter options with caching (server-side cache + client staleTime)
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes - matches server cache TTL
  }) as { data: FilterOptions | undefined };

  // Fetch models when single make is selected
  const { data: models } = api.vehicle.getModelsByMake.useQuery(
    { makeId: filters.makeIds?.[0]! },
    { 
      enabled: (filters.makeIds?.length ?? 0) === 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  ) as { data: ModelsByMake[] | undefined };

  // Transform filter options to FilterOption format
  const makeOptions: FilterOption[] =
    filterOptions?.makes.map((make) => ({
      id: make.id,
      name: make.name,
    })) ?? [];

  const collectionOptions: FilterOption[] =
    filterOptions?.collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      color: collection.color ?? undefined,
    })) ?? [];

  const exteriorColorOptions: FilterOption[] =
    filterOptions?.exteriorColors.map((color) => ({
      id: color,
      name: color,
    })) ?? [];

  const interiorColorOptions: FilterOption[] =
    filterOptions?.interiorColors.map((color) => ({
      id: color,
      name: color,
    })) ?? [];

  const modelOptions =
    models?.map((model) => ({
      value: model.id,
      label: model.name,
    })) ?? [];

  const seatsOptions: FilterOption[] =
    filterOptions?.seats.map((seats) => ({
      id: seats.toString(),
      name: `${seats} seats`,
    })) ?? [];

  const gearboxOptions: FilterOption[] =
    filterOptions?.gearboxTypes.map((type) => ({
      id: type,
      name: type,
    })) ?? [];

  const steeringOptions: FilterOption[] =
    filterOptions?.steeringTypes.map((steering) => ({
      id: steering.id,
      name: steering.name,
    })) ?? [];

  const countryOptions: FilterOption[] =
    filterOptions?.countries.map((country) => ({
      id: country.id,
      name: country.name,
    })) ?? [];

  const countyOptions: FilterOption[] =
    filterOptions?.counties.map((county) => ({
      id: county,
      name: county,
    })) ?? [];

  const handleStatusChange = (value?: string) => {
    // Convert undefined (from "All Status" selection) to "ALL" string for URL
    updateFilters({ status: value ? (value as any) : "ALL" });
  };

  const handleModelChange = (value?: string) => {
    // Clear model if no makes or multiple makes selected
    if ((filters.makeIds?.length ?? 0) !== 1) {
      updateFilters({ modelId: undefined });
    } else {
      updateFilters({ modelId: value });
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
        value={filters.status}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "IN_REVIEW", label: "In Review" },
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
        selectedIds={filters.makeIds ?? []}
        onChange={(makeIds) => updateFilters({ makeIds })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search makes..."
        className="md:w-[200px]"
      />

      {/* Model Filter */}
      <SingleSelectFilter
        label="All Models"
        value={filters.modelId}
        options={modelOptions}
        onChange={handleModelChange}
        placeholder="Model"
        disabled={(filters.makeIds?.length ?? 0) !== 1}
        className="md:w-[160px]"
      />

      {/* Collection Filter */}
      <MultiSelectFilter
        label="Select Collections"
        placeholder="Select collections..."
        options={collectionOptions}
        selectedIds={filters.collectionIds ?? []}
        onChange={(collectionIds) => updateFilters({ collectionIds })}
        renderOption={renderCollectionOption}
        searchPlaceholder="Search collections..."
        className="md:w-[200px]"
      />

      {/* Exterior Color Filter */}
      <MultiSelectFilter
        label="Select Exterior Colors"
        placeholder="Exterior colors..."
        options={exteriorColorOptions}
        selectedIds={filters.exteriorColors ?? []}
        onChange={(exteriorColors) => updateFilters({ exteriorColors })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search colors..."
        className="md:w-[180px]"
      />

      {/* Interior Color Filter */}
      <MultiSelectFilter
        label="Select Interior Colors"
        placeholder="Interior colors..."
        options={interiorColorOptions}
        selectedIds={filters.interiorColors ?? []}
        onChange={(interiorColors) => updateFilters({ interiorColors })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search colors..."
        className="md:w-[180px]"
      />

      {/* Year Range Filter */}
      <YearRangeFilter
        yearFrom={filters.yearFrom}
        yearTo={filters.yearTo}
        onYearFromChange={(yearFrom) => updateFilters({ yearFrom })}
        onYearToChange={(yearTo) => updateFilters({ yearTo })}
      />

      {/* Number of Seats Filter */}
      <MultiSelectFilter
        label="Select Seats"
        placeholder="Seats..."
        options={seatsOptions}
        selectedIds={(filters.numberOfSeats ?? []).map(String)}
        onChange={(ids) => updateFilters({ numberOfSeats: ids.map(Number) })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search seats..."
        className="md:w-[150px]"
      />

      {/* Gearbox Filter */}
      <MultiSelectFilter
        label="Select Gearbox"
        placeholder="Gearbox..."
        options={gearboxOptions}
        selectedIds={filters.gearboxTypes ?? []}
        onChange={(gearboxTypes) => updateFilters({ gearboxTypes })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search gearbox..."
        className="md:w-[150px]"
      />

      {/* Steering Filter */}
      <MultiSelectFilter
        label="Select Steering"
        placeholder="Steering..."
        options={steeringOptions}
        selectedIds={filters.steeringIds ?? []}
        onChange={(steeringIds) => updateFilters({ steeringIds })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search steering..."
        className="md:w-[180px]"
      />

      {/* Country Filter */}
      <MultiSelectFilter
        label="Select Countries"
        placeholder="Countries..."
        options={countryOptions}
        selectedIds={filters.countryIds ?? []}
        onChange={(countryIds) => updateFilters({ countryIds })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search countries..."
        className="md:w-[180px]"
      />

      {/* County Filter */}
      <MultiSelectFilter
        label="Select Counties"
        placeholder="Counties..."
        options={countyOptions}
        selectedIds={filters.counties ?? []}
        onChange={(counties) => updateFilters({ counties })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search counties..."
        className="md:w-[180px]"
      />

      {/* Distance Filter */}
      <DistanceFilter
        postcode={filters.postcode}
        maxDistance={filters.maxDistance}
        onPostcodeChange={(postcode) => updateFilters({ postcode })}
        onMaxDistanceChange={(maxDistance) => updateFilters({ maxDistance })}
        onPostcodeAndDistanceChange={(postcode, maxDistance) => updateFilters({ postcode, maxDistance })}
      />

      {/* Sort Filter */}
      <SortFilter
        sortBy={filters.sortBy ?? "createdAt"}
        sortOrder={filters.sortOrder ?? "desc"}
        onSortChange={(sortBy, sortOrder) => updateFilters({ sortBy, sortOrder })}
        hasDistanceFilter={!!filters.postcode && !!filters.maxDistance}
      />

      {/* Clear Filters */}
      <FilterActions
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      />
    </>
  );
}

