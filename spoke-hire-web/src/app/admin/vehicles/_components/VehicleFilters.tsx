"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
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

interface VehicleFiltersProps {
  search?: string;
  status?: VehicleStatus;
  makeIds?: string[];
  modelId?: string;
  yearFrom?: string;
  yearTo?: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status?: VehicleStatus) => void;
  onMakeIdsChange: (makeIds: string[]) => void;
  onModelChange: (modelId?: string) => void;
  onYearFromChange: (year?: string) => void;
  onYearToChange: (year?: string) => void;
  onClearFilters: () => void;
}

/**
 * Vehicle Filters
 * 
 * Search and filter controls for vehicle list
 */
export function VehicleFilters({
  search = "",
  status,
  makeIds = [],
  modelId,
  yearFrom,
  yearTo,
  onSearchChange,
  onStatusChange,
  onMakeIdsChange,
  onModelChange,
  onYearFromChange,
  onYearToChange,
  onClearFilters,
}: VehicleFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);
  const [makeOpen, setMakeOpen] = useState(false);

  // Fetch filter options
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery();

  // Fetch models when make is selected
  const { data: models } = api.vehicle.getModelsByMake.useQuery(
    { makeId: makeIds[0]! },
    { enabled: makeIds.length === 1 }
  );

  const hasActiveFilters = !!(search || status || makeIds.length > 0 || modelId || yearFrom || yearTo);

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

  const handleClearFilters = () => {
    setSearchInput("");
    onClearFilters();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vehicles, make, model, registration..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            {/* Status Filter */}
            <Select value={status ?? "all"} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[160px]">
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
                  className="w-[200px] justify-between"
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
              <PopoverContent className="w-[200px] p-0" align="start">
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
              <SelectTrigger className="w-[160px]">
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

            {/* Year From Select */}
            <Select
              value={yearFrom ?? "all"}
              onValueChange={handleYearFromChange}
            >
              <SelectTrigger className="w-[140px]">
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
              <SelectTrigger className="w-[140px]">
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
                className="ml-auto"
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

