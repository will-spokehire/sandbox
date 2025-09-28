"use client";

import { useState, useEffect, useCallback } from "react";
import { type VehicleFilters } from "~/types/vehicle";

interface AdvancedFiltersProps {
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
    withContact: number;
    withoutContact: number;
    withImages: number;
    withoutImages: number;
    duplicates: number;
    unique: number;
    regDuplicates: number;
    regUnique: number;
  };
  totalRecords: number;
}

export function AdvancedFilters({ onFiltersChange, filterCounts, totalRecords }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<VehicleFilters>({
    duplicateFilter: 'unique' // Default to showing only unique records (no duplicates)
  });

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = useCallback((key: keyof VehicleFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' || value === undefined ? undefined : value,
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== 'all'
  );

  const getFilterCount = (filterType: string, value: string) => {
    switch (filterType) {
      case 'published':
        return value === 'published' ? filterCounts.published : 
               value === 'unpublished' ? filterCounts.all - filterCounts.published : 
               filterCounts.all;
      case 'catalog':
        return value === 'include' ? filterCounts.multi :
               value === 'only' ? filterCounts.catalog : filterCounts.all;
      case 'cleansed':
        return value === 'only' ? filterCounts.cleansed : filterCounts.all;
      case 'submission':
        return value === 'only' ? filterCounts.submission : filterCounts.all;
      case 'address':
        return value === 'with' ? filterCounts.withAddress :
               value === 'without' ? filterCounts.all - filterCounts.withAddress : filterCounts.all;
      case 'registration':
        return value === 'with' ? filterCounts.withRegistration :
               value === 'without' ? filterCounts.all - filterCounts.withRegistration : filterCounts.all;
      case 'duplicate':
        return value === 'duplicates' ? filterCounts.duplicates :
               value === 'unique' ? filterCounts.unique : filterCounts.all;
      case 'regDuplicate':
        return value === 'reg-duplicates' ? filterCounts.regDuplicates :
               value === 'reg-unique' ? filterCounts.regUnique : filterCounts.all;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Advanced Filters</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 'all').length} active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              <svg 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Content */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Publication Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Publication Status
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All', count: filterCounts.all },
                  { value: 'published', label: 'Published', count: filterCounts.published },
                  { value: 'unpublished', label: 'Unpublished', count: filterCounts.all - filterCounts.published },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="published"
                      value={option.value}
                      checked={filters.published === (option.value === 'published') && option.value !== 'all'}
                      onChange={() => updateFilter('published', option.value === 'published' ? true : option.value === 'unpublished' ? false : undefined)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Catalog Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Source
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Sources', count: filterCounts.all },
                  { value: 'include', label: 'Multi-Source', count: filterCounts.multi },
                  { value: 'only', label: 'Website Catalog Only', count: filterCounts.catalog },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="catalogFilter"
                      value={option.value}
                      checked={filters.catalogFilter === option.value}
                      onChange={() => updateFilter('catalogFilter', option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cleansed Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cleansed Data Source
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Sources', count: filterCounts.all },
                  { value: 'only', label: 'Cleansed Data Only', count: filterCounts.cleansed },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="cleansedFilter"
                      value={option.value}
                      checked={filters.cleansedFilter === option.value}
                      onChange={() => updateFilter('cleansedFilter', option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submission Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Submission Data Source
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Sources', count: filterCounts.all },
                  { value: 'only', label: 'User Submission Only', count: filterCounts.submission },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="submissionFilter"
                      value={option.value}
                      checked={filters.submissionFilter === option.value}
                      onChange={() => updateFilter('submissionFilter', option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Address Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Information
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All', count: filterCounts.all },
                  { value: 'with', label: 'With Address', count: filterCounts.withAddress },
                  { value: 'without', label: 'Without Address', count: filterCounts.all - filterCounts.withAddress },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="addressFilter"
                      value={option.value}
                      checked={filters.hasAddress === (option.value === 'with') && option.value !== 'all'}
                      onChange={() => updateFilter('hasAddress', option.value === 'with' ? true : option.value === 'without' ? false : undefined)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Registration Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All', count: filterCounts.all },
                  { value: 'with', label: 'With Registration', count: filterCounts.withRegistration },
                  { value: 'without', label: 'Without Registration', count: filterCounts.all - filterCounts.withRegistration },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="registrationFilter"
                      value={option.value}
                      checked={filters.hasRegistration === (option.value === 'with') && option.value !== 'all'}
                      onChange={() => updateFilter('hasRegistration', option.value === 'with' ? true : option.value === 'without' ? false : undefined)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Contact Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Information
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All', count: filterCounts.all },
                  { value: 'with', label: 'With Contact', count: filterCounts.withContact },
                  { value: 'without', label: 'No Contact', count: filterCounts.withoutContact },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="contactFilter"
                      value={option.value}
                      checked={filters.hasContact === (option.value === 'with' ? true : option.value === 'without' ? false : undefined)}
                      onChange={() => updateFilter('hasContact', option.value === 'with' ? true : option.value === 'without' ? false : undefined)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Image Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Images
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All', count: filterCounts.all },
                  { value: 'with', label: 'With Images', count: filterCounts.withImages },
                  { value: 'without', label: 'No Images', count: filterCounts.withoutImages },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="imageFilter"
                      value={option.value}
                      checked={filters.hasImages === (option.value === 'with' ? true : option.value === 'without' ? false : undefined)}
                      onChange={() => updateFilter('hasImages', option.value === 'with' ? true : option.value === 'without' ? false : undefined)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Duplicate Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duplicate Records
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Records', count: filterCounts.all },
                  { value: 'duplicates', label: 'Duplicate Records', count: filterCounts.duplicates },
                  { value: 'unique', label: 'Unique Records (no duplicates)', count: filterCounts.unique },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="duplicateFilter"
                      value={option.value}
                      checked={filters.duplicateFilter === (option.value === 'all' ? undefined : option.value)}
                      onChange={() => updateFilter('duplicateFilter', option.value === 'all' ? undefined : option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Registration Duplicate Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Duplicates
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All Records', count: filterCounts.all },
                  { value: 'reg-duplicates', label: 'Registration Duplicates', count: filterCounts.regDuplicates },
                  { value: 'reg-unique', label: 'Unique Registrations', count: filterCounts.regUnique },
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="regDuplicateFilter"
                      value={option.value}
                      checked={filters.regDuplicateFilter === (option.value === 'all' ? undefined : option.value)}
                      onChange={() => updateFilter('regDuplicateFilter', option.value === 'all' ? undefined : option.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label} ({option.count.toLocaleString()})
                    </span>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.published !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {filters.published ? 'Published' : 'Unpublished'}
                    <button
                      onClick={() => updateFilter('published', undefined)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}
                
                {filters.catalogFilter && filters.catalogFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Catalog: {filters.catalogFilter}
                    <button
                      onClick={() => updateFilter('catalogFilter', 'all')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.cleansedFilter && filters.cleansedFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Cleansed: {filters.cleansedFilter}
                    <button
                      onClick={() => updateFilter('cleansedFilter', 'all')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.submissionFilter && filters.submissionFilter !== 'all' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Submission: {filters.submissionFilter}
                    <button
                      onClick={() => updateFilter('submissionFilter', 'all')}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-orange-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.hasAddress !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    {filters.hasAddress ? 'With Address' : 'Without Address'}
                    <button
                      onClick={() => updateFilter('hasAddress', undefined)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-indigo-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.hasRegistration !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                    {filters.hasRegistration ? 'With Registration' : 'Without Registration'}
                    <button
                      onClick={() => updateFilter('hasRegistration', undefined)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-pink-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.hasContact !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {filters.hasContact ? 'With Contact' : 'No Contact'}
                    <button
                      onClick={() => updateFilter('hasContact', undefined)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-purple-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.hasImages !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {filters.hasImages ? 'With Images' : 'No Images'}
                    <button
                      onClick={() => updateFilter('hasImages', undefined)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-green-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.duplicateFilter !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {filters.duplicateFilter === 'duplicates' ? 'Duplicate Records' :
                     filters.duplicateFilter === 'unique' ? 'Unique Records' : 'Duplicate Filter'}
                    <button
                      onClick={() => updateFilter('duplicateFilter', undefined)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-orange-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}

                {filters.regDuplicateFilter !== undefined && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {filters.regDuplicateFilter === 'reg-duplicates' ? 'Registration Duplicates' :
                     filters.regDuplicateFilter === 'reg-unique' ? 'Unique Registrations' : 'Registration Filter'}
                    <button
                      onClick={() => updateFilter('regDuplicateFilter', undefined)}
                      className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-red-200"
                    >
                      <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 8">
                        <path d="m0 0 2 2 2-2 1 1-2 2 2 2-1 1-2-2-2 2-1-1 2-2-2-2z"/>
                      </svg>
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
