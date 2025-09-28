"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";
import { type VehicleData, type VehicleFilters } from "~/types/vehicle";
import { Stats, SearchFilters, VehicleList, VehicleDetail, SortControls } from "~/app/_components/vehicles";
import { LoadingSpinner, EmptyState, Header, Sidebar, AppHeader } from "~/app/_components/ui";

interface VehicleCatalogViewerProps {
  initialSearch?: string;
}

export function VehicleCatalogViewer({ initialSearch }: VehicleCatalogViewerProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [filters, setFilters] = useState<VehicleFilters>(() => ({
    ...(initialSearch && { search: initialSearch })
  }));
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);

  // Fetch data using tRPC
  const { data: stats, isLoading: statsLoading } = api.vehicles.getStats.useQuery();
  const { data: filterCounts, isLoading: filterCountsLoading } = api.vehicles.getFilterCounts.useQuery();
  const { data: vehiclesData, isLoading: vehiclesLoading } = api.vehicles.getAll.useQuery({
    ...filters,
    limit: pageSize,
    offset: currentPage * pageSize,
  });
  const { data: selectedVehicle, isLoading: selectedVehicleLoading } = api.vehicles.getById.useQuery(
    { id: selectedVehicleId! },
    { enabled: !!selectedVehicleId }
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [filters]);

  const handleVehicleSelect = useCallback((vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
  }, []);

  const handleFiltersChange = useCallback((newFilters: VehicleFilters) => {
    setFilters(newFilters);
  }, []);

  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sortBy: sortBy as VehicleFilters['sortBy'],
      sortOrder: sortOrder as VehicleFilters['sortOrder'],
    }));
  }, []);

  const handleLoadMore = useCallback(() => {
    setCurrentPage(prev => prev + 1);
  }, []);

  const isLoading = statsLoading || filterCountsLoading || vehiclesLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* App Header with Auth */}
      <AppHeader />

      <div className="container mx-auto p-6">

      {/* Statistics */}
      {stats && filterCounts && (
        <>
          <Stats stats={stats} isLoading={statsLoading} />
          
          <SearchFilters
            onFiltersChange={handleFiltersChange}
            filterCounts={filterCounts}
            totalRecords={stats.totalRecords}
            initialSearch={initialSearch}
          />
          
          <SortControls
            onSortChange={handleSortChange}
            currentSort={filters.sortBy}
            currentOrder={filters.sortOrder}
          />
        </>
      )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vehicle List */}
          <div className="lg:col-span-1">
            <Sidebar 
              title="Vehicles" 
              isCollapsible 
              className="h-[calc(100vh-12rem)]"
            >
              <VehicleList
                vehicles={vehiclesData?.vehicles || []}
                totalCount={vehiclesData?.total || 0}
                selectedVehicleId={selectedVehicleId}
                onVehicleSelect={handleVehicleSelect}
                isLoading={isLoading}
              />
            </Sidebar>
          </div>

        {/* Vehicle Detail */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
            {!selectedVehicleId ? (
              <div className="p-8">
                <EmptyState
                  title="Select a vehicle to view details"
                  description="Choose any vehicle from the list on the left to see its complete information, images, and owner details."
                  icon="🚗"
                />
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500">
                    <strong>💡 Tip:</strong> The list shows all vehicles by default. Use the search box above to filter results.
                  </p>
                </div>
              </div>
            ) : selectedVehicleLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
                <span className="ml-2 text-gray-600">Loading vehicle details...</span>
              </div>
            ) : selectedVehicle ? (
              <div className="p-6">
                <VehicleDetail vehicle={selectedVehicle} />
              </div>
            ) : (
              <div className="p-8">
                <EmptyState
                  title="Vehicle not found"
                  description="The selected vehicle could not be found or may have been removed."
                  icon="❌"
                />
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Vehicle catalog data loaded from JSON files • 
              Built with T3 Stack (Next.js, tRPC, TypeScript, Tailwind CSS)
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
