"use client";

import { useState } from "react";
import * as React from "react";
import { Filter, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Badge } from "~/components/ui/badge";
import { usePublicVehicleFiltersContext } from "~/contexts/PublicVehicleFiltersContext";
import { api } from "~/trpc/react";
import { MultiSelectFilter } from "~/app/admin/vehicles/_components/filters/MultiSelectFilter";
import { Check } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * Public Vehicle Filters
 * 
 * Filter controls for the public vehicle catalogue.
 * Includes: make, model, decade (year range), location, collections.
 * NO price filter or search.
 */
export function PublicVehicleFilters() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = usePublicVehicleFiltersContext();
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch filter options with current filters for cascading behavior
  const { data: filterOptions, isLoading: isLoadingFilters } = api.publicVehicle.getFilterOptions.useQuery(
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
      staleTime: 30000, // 30 seconds - shorter than default for dynamic options
    }
  );

  // Models are now included in filter options response
  const modelOptions = filterOptions?.models?.map((model) => ({
    value: model.id,
    label: model.name,
  })) ?? [];
  // Transform filter options
  const makeOptions = filterOptions?.makes?.map((make) => ({
    id: make.id,
    name: make.name,
  })) ?? [];

  const collectionOptions = filterOptions?.collections?.map((collection) => ({
    id: collection.id,
    name: collection.name,
    color: collection.color ?? undefined,
  })) ?? [];

  const countryOptions = filterOptions?.countries?.map((country) => ({
    id: country.id,
    name: country.name,
  })) ?? [];

  const countyOptions = filterOptions?.counties?.map((county) => ({
    id: county,
    name: county,
  })) ?? [];

  // Decade options (1920s - 2020s)
  const currentYear = new Date().getFullYear();
  const startDecade = 1920;
  const decades: Array<{ id: string; name: string; yearFrom: string; yearTo: string }> = [];
  for (let year = startDecade; year <= currentYear; year += 10) {
    const decadeEnd = Math.min(year + 9, currentYear);
    decades.push({
      id: `${year}s`,
      name: `${year}s`,
      yearFrom: String(year),
      yearTo: String(decadeEnd),
    });
  }
  decades.reverse(); // Most recent first

  const handleModelChange = (value: string) => {
    updateFilters({ modelId: value || undefined });
  };

  // Clear model when multiple makes are selected
  const multipleMakesSelected = (filters.makeIds?.length ?? 0) > 1;
  
  // Auto-clear model if multiple makes are selected
  React.useEffect(() => {
    if (multipleMakesSelected && filters.modelId) {
      updateFilters({ modelId: undefined });
    }
  }, [multipleMakesSelected, filters.modelId, updateFilters]);

  const handleDecadeChange = (decadeIds: string[]) => {
    if (decadeIds.length === 0) {
      updateFilters({ yearFrom: undefined, yearTo: undefined });
    } else {
      // Use first selected decade
      const decade = decades.find((d) => d.id === decadeIds[0]);
      if (decade) {
        updateFilters({ yearFrom: decade.yearFrom, yearTo: decade.yearTo });
      }
    }
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const activeFilterCount =
    (filters.makeIds?.length ?? 0) +
    (filters.modelId ? 1 : 0) +
    (filters.collectionIds?.length ?? 0) +
    (filters.yearFrom ? 1 : 0) +
    (filters.countryIds?.length ?? 0) +
    (filters.counties?.length ?? 0);

  // Render collection option with color badge
  const renderCollectionOption = (option: { id: string; name: string; color?: string }, selected: boolean) => (
    <>
      {option.color && (
        <div
          className="mr-2 h-3 w-3 rounded-full"
          style={{ backgroundColor: option.color }}
        />
      )}
      {option.name}
    </>
  );

  // Render standard option
  const renderStandardOption = (option: { id: string; name: string }, selected: boolean) => (
    <>
      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
      {option.name}
    </>
  );

  // Get selected decade for display
  const selectedDecade = filters.yearFrom
    ? decades.find((d) => d.yearFrom === filters.yearFrom)
    : undefined;

  return (
    <div className="space-y-4">
      {/* Mobile: Filter Button + Sheet */}
      <div className="flex md:hidden gap-2 items-center">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex-1 gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <FilterControls
                makeOptions={makeOptions}
                modelOptions={modelOptions}
                collectionOptions={collectionOptions}
                countryOptions={countryOptions}
                countyOptions={countyOptions}
                decades={decades}
                selectedDecade={selectedDecade}
                filters={filters}
                updateFilters={updateFilters}
                handleModelChange={handleModelChange}
                handleDecadeChange={handleDecadeChange}
                renderCollectionOption={renderCollectionOption}
                renderStandardOption={renderStandardOption}
                isLoadingFilters={isLoadingFilters}
              />
            </div>
          </SheetContent>
        </Sheet>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Desktop: Inline Filters with Modern Design */}
      <div className="hidden md:block">
        <div className="flex flex-wrap gap-3 items-start">
          <FilterControls
            makeOptions={makeOptions}
            modelOptions={modelOptions}
            collectionOptions={collectionOptions}
            countryOptions={countryOptions}
            countyOptions={countyOptions}
            decades={decades}
            selectedDecade={selectedDecade}
            filters={filters}
            updateFilters={updateFilters}
            handleModelChange={handleModelChange}
            handleDecadeChange={handleDecadeChange}
            renderCollectionOption={renderCollectionOption}
            renderStandardOption={renderStandardOption}
            isLoadingFilters={isLoadingFilters}
          />

          {hasActiveFilters && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearFilters}
              className="self-start"
            >
              <X className="h-4 w-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Filter Controls Component (reused for mobile/desktop)
function FilterControls({
  makeOptions,
  modelOptions,
  collectionOptions,
  countryOptions,
  countyOptions,
  decades,
  selectedDecade,
  filters,
  updateFilters,
  handleModelChange,
  handleDecadeChange,
  renderCollectionOption,
  renderStandardOption,
  isLoadingFilters,
}: any) {
  // Check if multiple makes are selected
  const multipleMakesSelected = (filters.makeIds?.length ?? 0) > 1;

  return (
    <>
      {/* Make Filter */}
      <MultiSelectFilter
        label="Select Makes"
        placeholder="All makes"
        options={makeOptions}
        selectedIds={filters.makeIds ?? []}
        onChange={(makeIds) => {
          updateFilters({ makeIds, modelId: undefined });
        }}
        renderOption={renderStandardOption}
        searchPlaceholder="Search makes..."
        className="md:w-[180px]"
      />

      {/* Model Filter */}
      {/* <div className="relative mb-6 md:mb-0">
        <MultiSelectFilter
          label="Select Model"
          placeholder={multipleMakesSelected ? "Select one make first" : "All models"}
          options={modelOptions.map((m: any) => ({ id: m.value, name: m.label }))}
          selectedIds={filters.modelId ? [filters.modelId] : []}
          onChange={(ids) => handleModelChange(ids[0] ?? "")}
          renderOption={renderStandardOption}
          searchPlaceholder="Search models..."
          className="md:w-[160px]"
        />
        {multipleMakesSelected && (
          <div className="absolute top-full left-0 mt-1 text-xs text-muted-foreground whitespace-nowrap">
            Select one make to filter by model
          </div>
        )}
      </div> */}

      {/* Decade Filter */}
      <MultiSelectFilter
        label="Select Decade"
        placeholder="All decades"
        options={decades}
        selectedIds={selectedDecade ? [selectedDecade.id] : []}
        onChange={handleDecadeChange}
        renderOption={renderStandardOption}
        searchPlaceholder="Search decades..."
        className="md:w-[160px]"
      />

      {/* Country Filter */}
      {/* <MultiSelectFilter
        label="Select Countries"
        placeholder="All countries"
        options={countryOptions}
        selectedIds={filters.countryIds ?? []}
        onChange={(countryIds) => updateFilters({ countryIds })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search countries..."
        className="md:w-[180px]"
      /> */}

      {/* County Filter */}
      {/* <MultiSelectFilter
        label="Select Counties"
        placeholder="All counties"
        options={countyOptions}
        selectedIds={filters.counties ?? []}
        onChange={(counties) => updateFilters({ counties })}
        renderOption={renderStandardOption}
        searchPlaceholder="Search counties..."
        className="md:w-[180px]"
      /> */}

      {/* Collections Filter */}
      <MultiSelectFilter
        label="Select Collections"
        placeholder="All collections"
        options={collectionOptions}
        selectedIds={filters.collectionIds ?? []}
        onChange={(collectionIds) => updateFilters({ collectionIds })}
        renderOption={renderCollectionOption}
        searchPlaceholder="Search collections..."
        className="md:w-[200px]"
      />
    </>
  );
}

