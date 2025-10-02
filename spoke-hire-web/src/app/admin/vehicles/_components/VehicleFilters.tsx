"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search, X, SlidersHorizontal, ChevronDown } from "lucide-react";
import { VehicleStatus } from "@prisma/client";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent } from "~/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";

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
  onSearchChange: (search: string) => void;
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
  onSearchChange,
  onStatusChange,
  onMakeIdsChange,
  onModelChange,
  onCollectionIdsChange,
  onExteriorColorsChange,
  onInteriorColorsChange,
  onYearFromChange,
  onYearToChange,
  onClearFilters,
}: VehicleFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);
  const [makeOpen, setMakeOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [exteriorColorOpen, setExteriorColorOpen] = useState(false);
  const [interiorColorOpen, setInteriorColorOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Fetch filter options
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery();

  // Fetch models when make is selected
  const { data: models } = api.vehicle.getModelsByMake.useQuery(
    { makeId: makeIds[0]! },
    { enabled: makeIds.length === 1 }
  );

  const hasActiveFilters = !!(search || status || makeIds.length > 0 || modelId || collectionIds.length > 0 || exteriorColors.length > 0 || interiorColors.length > 0 || yearFrom || yearTo);
  
  // Count active non-search filters for badge
  const activeFilterCount = 
    (status ? 1 : 0) +
    makeIds.length +
    (modelId ? 1 : 0) +
    collectionIds.length +
    exteriorColors.length +
    interiorColors.length +
    (yearFrom ? 1 : 0) +
    (yearTo ? 1 : 0);

  // Generate year options (from 1900 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1900 + 2 },
    (_, i) => (currentYear + 1 - i).toString()
  );

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onSearchChange(value);
  };

  const handleMakeToggle = (makeId: string) => {
    const newMakeIds = makeIds.includes(makeId)
      ? makeIds.filter((id) => id !== makeId)
      : [...makeIds, makeId];
    
    onMakeIdsChange(newMakeIds);
    
    // Clear model if no makes or multiple makes selected
    if (newMakeIds.length !== 1) {
      onModelChange(undefined);
    }
  };

  const handleModelChange = (value: string) => {
    if (value === "all") {
      onModelChange(undefined);
    } else {
      onModelChange(value);
    }
  };

  const handleStatusChange = (value: string) => {
    if (value === "all") {
      onStatusChange(undefined);
    } else {
      onStatusChange(value as VehicleStatus);
    }
  };

  const handleYearFromChange = (value: string) => {
    if (value === "all") {
      onYearFromChange(undefined);
    } else {
      onYearFromChange(value);
    }
  };

  const handleYearToChange = (value: string) => {
    if (value === "all") {
      onYearToChange(undefined);
    } else {
      onYearToChange(value);
    }
  };

  const handleCollectionToggle = (collectionId: string) => {
    const newCollectionIds = collectionIds.includes(collectionId)
      ? collectionIds.filter((id) => id !== collectionId)
      : [...collectionIds, collectionId];
    
    onCollectionIdsChange(newCollectionIds);
  };

  const handleExteriorColorToggle = (color: string) => {
    const newColors = exteriorColors.includes(color)
      ? exteriorColors.filter((c) => c !== color)
      : [...exteriorColors, color];
    
    onExteriorColorsChange(newColors);
  };

  const handleInteriorColorToggle = (color: string) => {
    const newColors = interiorColors.includes(color)
      ? interiorColors.filter((c) => c !== color)
      : [...interiorColors, color];
    
    onInteriorColorsChange(newColors);
  };

  const handleClearFilters = () => {
    setSearchInput("");
    onClearFilters();
  };

  // Render filter controls - shared between mobile and desktop
  const renderFilters = (isMobile: boolean) => (
    <>
      {/* Status Filter */}
      <Select value={status ?? "all"} onValueChange={handleStatusChange}>
        <SelectTrigger className={cn(isMobile ? "w-full" : "w-[160px]")}>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="DRAFT">Draft</SelectItem>
          <SelectItem value="PUBLISHED">Published</SelectItem>
          <SelectItem value="DECLINED">Declined</SelectItem>
          <SelectItem value="ARCHIVED">Archived</SelectItem>
        </SelectContent>
      </Select>

      {/* Make Filter - Multi-select with Search */}
      <Popover open={makeOpen} onOpenChange={setMakeOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={makeOpen}
            className={cn("justify-between", isMobile ? "w-full" : "w-[200px]")}
          >
            {makeIds.length === 0 ? (
              "Select makes..."
            ) : (
              <div className="flex gap-1 flex-wrap">
                {makeIds.length === 1 ? (
                  <span>
                    {filterOptions?.makes.find((m) => m.id === makeIds[0])?.name}
                  </span>
                ) : (
                  <span>{makeIds.length} makes selected</span>
                )}
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search makes..." />
            <CommandList>
              <CommandEmpty>No make found.</CommandEmpty>
              <CommandGroup>
                {filterOptions?.makes.map((make) => (
                  <CommandItem
                    key={make.id}
                    value={make.name}
                    onSelect={() => handleMakeToggle(make.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        makeIds.includes(make.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {make.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Model Filter (only enabled when single make is selected) */}
      <Select
        value={modelId ?? "all"}
        onValueChange={handleModelChange}
        disabled={makeIds.length !== 1}
      >
        <SelectTrigger className={cn(isMobile ? "w-full" : "w-[160px]")}>
          <SelectValue placeholder="Model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Models</SelectItem>
          {models?.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Collection Filter - Multi-select with Search */}
      <Popover open={collectionOpen} onOpenChange={setCollectionOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={collectionOpen}
            className={cn("justify-between", isMobile ? "w-full" : "w-[200px]")}
          >
            {collectionIds.length === 0 ? (
              "Select collections..."
            ) : (
              <div className="flex gap-1 flex-wrap">
                {collectionIds.length === 1 ? (
                  <span>
                    {filterOptions?.collections.find((c) => c.id === collectionIds[0])?.name}
                  </span>
                ) : (
                  <span>{collectionIds.length} collections</span>
                )}
              </div>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search collections..." />
            <CommandList>
              <CommandEmpty>No collection found.</CommandEmpty>
              <CommandGroup>
                {filterOptions?.collections.map((collection) => (
                  <CommandItem
                    key={collection.id}
                    value={collection.name}
                    onSelect={() => handleCollectionToggle(collection.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        collectionIds.includes(collection.id) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {collection.color && (
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: collection.color }}
                      />
                    )}
                    {collection.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Exterior Color Filter - Multi-select */}
      <Popover open={exteriorColorOpen} onOpenChange={setExteriorColorOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={exteriorColorOpen}
            className={cn("justify-between", isMobile ? "w-full" : "w-[180px]")}
          >
            {exteriorColors.length === 0 ? (
              "Exterior colors..."
            ) : (
              <span>{exteriorColors.length} exterior{exteriorColors.length !== 1 ? ' colors' : ''}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search colors..." />
            <CommandList>
              <CommandEmpty>No color found.</CommandEmpty>
              <CommandGroup>
                {filterOptions?.exteriorColors.map((color) => (
                  <CommandItem
                    key={`ext-${color}`}
                    value={color}
                    onSelect={() => handleExteriorColorToggle(color)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        exteriorColors.includes(color) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {color}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Interior Color Filter - Multi-select */}
      <Popover open={interiorColorOpen} onOpenChange={setInteriorColorOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={interiorColorOpen}
            className={cn("justify-between", isMobile ? "w-full" : "w-[180px]")}
          >
            {interiorColors.length === 0 ? (
              "Interior colors..."
            ) : (
              <span>{interiorColors.length} interior{interiorColors.length !== 1 ? ' colors' : ''}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search colors..." />
            <CommandList>
              <CommandEmpty>No color found.</CommandEmpty>
              <CommandGroup>
                {filterOptions?.interiorColors.map((color) => (
                  <CommandItem
                    key={`int-${color}`}
                    value={color}
                    onSelect={() => handleInteriorColorToggle(color)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        interiorColors.includes(color) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {color}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Year From Select */}
      <Select
        value={yearFrom ?? "all"}
        onValueChange={handleYearFromChange}
      >
        <SelectTrigger className={cn(isMobile ? "w-full" : "w-[130px]")}>
          <SelectValue placeholder="Year from" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Year from</SelectItem>
          {yearOptions.map((year) => (
            <SelectItem key={`from-${year}`} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year To Select */}
      <Select
        value={yearTo ?? "all"}
        onValueChange={handleYearToChange}
      >
        <SelectTrigger className={cn(isMobile ? "w-full" : "w-[130px]")}>
          <SelectValue placeholder="Year to" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Year to</SelectItem>
          {yearOptions.map((year) => (
            <SelectItem key={`to-${year}`} value={year}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className={cn(isMobile ? "w-full" : "ml-auto")}
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </>
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search - Always visible */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vehicles, owners..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Mobile: Collapsible Filters */}
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen} className="md:hidden">
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] flex items-center justify-center px-1.5">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", filtersOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="pt-4">
              <div className="flex flex-col gap-3">
                {renderFilters(true)}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Desktop: Always visible filters */}
          <div className="hidden md:flex md:flex-wrap gap-3">
            {renderFilters(false)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
