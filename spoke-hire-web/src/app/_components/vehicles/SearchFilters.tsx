"use client";

import { useState, useEffect, useCallback } from "react";
import { type VehicleFilters } from "~/types/vehicle";
import { AdvancedFilters } from "./AdvancedFilters";

interface SearchFiltersProps {
  onFiltersChange: (filters: VehicleFilters) => void;
  filterCounts: {
    all: number;
    catalog: number;
    cleansed: number;
    submission: number;
    'has-submission': number;
    'has-cleansed': number;
    multi: number;
    published: number;
    withAddress: number;
    withRegistration: number;
    duplicates: number;
    unique: number;
    regDuplicates: number;
    regUnique: number;
  };
  totalRecords: number;
  initialSearch?: string;
}

export function SearchFilters({ onFiltersChange, filterCounts, totalRecords, initialSearch }: SearchFiltersProps) {
  const [search, setSearch] = useState(initialSearch || "");
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch || "");
  const [advancedFilters, setAdvancedFilters] = useState<VehicleFilters>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Update filters when search or advanced filters change
  useEffect(() => {
    const filters: VehicleFilters = {
      search: debouncedSearch.trim() || undefined,
      ...advancedFilters,
    };

    onFiltersChange(filters);
  }, [debouncedSearch, advancedFilters, onFiltersChange]);

  const handleAdvancedFiltersChange = useCallback((newFilters: VehicleFilters) => {
    setAdvancedFilters(newFilters);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Vehicles
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`🔍 Search all ${totalRecords.toLocaleString()} vehicles...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Active Search Filter Display */}
          {search && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Active search:</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                "{search}"
                <button
                  onClick={() => setSearch("")}
                  className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                >
                  <span className="sr-only">Remove search filter</span>
                  <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                    <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                  </svg>
                </button>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      <AdvancedFilters
        onFiltersChange={handleAdvancedFiltersChange}
        filterCounts={filterCounts}
        totalRecords={totalRecords}
      />
    </div>
  );
}
