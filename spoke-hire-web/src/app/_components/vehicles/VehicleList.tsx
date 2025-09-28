"use client";

import { useState } from "react";
import { type VehicleData } from "~/types/vehicle";
import { VehicleCard } from "./VehicleCard";
import { Pagination } from "../ui/Pagination";
import { LoadingSpinner, EmptyState } from "../ui";

interface VehicleListProps {
  vehicles: VehicleData[];
  totalCount: number;
  selectedVehicleId: string | null;
  onVehicleSelect: (vehicleId: string) => void;
  isLoading?: boolean;
  itemsPerPage?: number;
}

export function VehicleList({
  vehicles,
  totalCount,
  selectedVehicleId,
  onVehicleSelect,
  isLoading = false,
  itemsPerPage = 20,
}: VehicleListProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-gray-600">Loading vehicles...</span>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="p-8">
        <EmptyState
          title="No vehicles found"
          description="Try adjusting your search or filter criteria"
          icon="🔍"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filtered Results Count */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">
            Vehicles ({totalCount.toLocaleString()})
          </h3>
          {totalCount !== vehicles.length && (
            <span className="text-xs text-gray-500">
              Showing {vehicles.length} of {totalCount.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Vehicle Cards - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              isSelected={selectedVehicleId === vehicle.id}
              onClick={onVehicleSelect}
            />
          ))}
        </div>
      </div>

      {/* Pagination - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalCount}
          />
        </div>
      )}
    </div>
  );
}
