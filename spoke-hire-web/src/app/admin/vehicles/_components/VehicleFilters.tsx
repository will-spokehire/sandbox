"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
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
import { api } from "~/trpc/react";

interface VehicleFiltersProps {
  search?: string;
  status?: VehicleStatus;
  makeId?: string;
  modelId?: string;
  onSearchChange: (search: string) => void;
  onStatusChange: (status?: VehicleStatus) => void;
  onMakeChange: (makeId?: string) => void;
  onModelChange: (modelId?: string) => void;
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
  makeId,
  modelId,
  onSearchChange,
  onStatusChange,
  onMakeChange,
  onModelChange,
  onClearFilters,
}: VehicleFiltersProps) {
  const [searchInput, setSearchInput] = useState(search);

  // Fetch filter options
  const { data: filterOptions } = api.vehicle.getFilterOptions.useQuery();

  // Fetch models when make is selected
  const { data: models } = api.vehicle.getModelsByMake.useQuery(
    { makeId: makeId! },
    { enabled: !!makeId }
  );

  const hasActiveFilters = !!(search || status || makeId || modelId);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    onSearchChange(value);
  };

  const handleMakeChange = (value: string) => {
    if (value === "all") {
      onMakeChange(undefined);
      onModelChange(undefined); // Clear model when make changes
    } else {
      onMakeChange(value);
      onModelChange(undefined); // Clear model when make changes
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

            {/* Make Filter */}
            <Select value={makeId ?? "all"} onValueChange={handleMakeChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Makes</SelectItem>
                {filterOptions?.makes.map((make) => (
                  <SelectItem key={make.id} value={make.id}>
                    {make.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Model Filter (only enabled when make is selected) */}
            <Select
              value={modelId ?? "all"}
              onValueChange={handleModelChange}
              disabled={!makeId}
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

