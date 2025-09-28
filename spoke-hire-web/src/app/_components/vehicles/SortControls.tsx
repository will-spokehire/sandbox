"use client";

import { useState, useEffect, useCallback } from "react";
import { type VehicleFilters } from "~/types/vehicle";

interface SortControlsProps {
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSort?: string;
  currentOrder?: 'asc' | 'desc';
}

export function SortControls({ onSortChange, currentSort, currentOrder }: SortControlsProps) {
  const [sortBy, setSortBy] = useState(currentSort || 'name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(currentOrder || 'asc');

  // Update parent when sort changes
  useEffect(() => {
    onSortChange(sortBy, sortOrder);
  }, [sortBy, sortOrder, onSortChange]);

  const handleSortByChange = useCallback((newSortBy: string) => {
    setSortBy(newSortBy);
  }, []);

  const handleSortOrderChange = useCallback((newSortOrder: 'asc' | 'desc') => {
    setSortOrder(newSortOrder);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  const sortOptions = [
    { value: 'name', label: 'Name (Make + Model + Year)' },
    { value: 'make', label: 'Make' },
    { value: 'model', label: 'Model' },
    { value: 'year', label: 'Year' },
    { value: 'registration', label: 'Registration' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Sort by:
          </label>
          
          <select
            value={sortBy}
            onChange={(e) => handleSortByChange(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleSortOrder}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              sortOrder === 'asc'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-800 border border-gray-200'
            }`}
            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            {sortOrder === 'asc' ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                A-Z
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                Z-A
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Sort Display */}
      {sortBy && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Active sort:</span>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {sortOptions.find(opt => opt.value === sortBy)?.label}
              <span className="ml-1">
                {sortOrder === 'asc' ? '↑' : '↓'}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
