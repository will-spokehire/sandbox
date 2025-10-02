"use client";

import { VehicleStatus } from "@prisma/client";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import { SingleSelectFilter } from "./SingleSelectFilter";
import { MultiSelectFilter } from "./MultiSelectFilter";
import { YearRangeFilter } from "./YearRangeFilter";
import { FilterActions } from "./FilterActions";
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
  hasActiveFilters,
  onStatusChange,
  onMakeIdsChange,
  onModelChange,
  onCollectionIdsChange,
  onExteriorColorsChange,
  onInteriorColorsChange,
  onYearFromChange,
  onYearToChange,
  onClearFilters,
}: FilterGridProps) {
  // Fetch filter options
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery();

  // Fetch models when single make is selected
  const { data: models } = api.vehicle.getModelsByMake.useQuery(
    { makeId: makeIds[0]! },
    { enabled: makeIds.length === 1 }
  );

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

  const handleStatusChange = (value?: string) => {
    onStatusChange(value as VehicleStatus | undefined);
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
        value={status}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "PUBLISHED", label: "Published" },
          { value: "DECLINED", label: "Declined" },
          { value: "ARCHIVED", label: "Archived" },
        ]}
        onChange={handleStatusChange}
        placeholder="Status"
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

      {/* Clear Filters */}
      <FilterActions
        hasActiveFilters={hasActiveFilters}
        onClear={onClearFilters}
      />
    </>
  );
}

