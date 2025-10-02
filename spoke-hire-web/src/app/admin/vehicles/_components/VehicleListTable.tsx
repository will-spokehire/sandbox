"use client";

import { type VehicleListItem } from "~/types/vehicle";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Skeleton } from "~/components/ui/skeleton";
import { VehicleTableRow } from "./VehicleTableRow";
import { VehicleCard } from "./VehicleCard";
import { VehicleListSkeleton } from "./VehicleListSkeleton";
import { VehicleEmptyState } from "./VehicleEmptyState";

interface VehicleListTableProps {
  vehicles: VehicleListItem[];
  isLoading?: boolean;
  hasFilters?: boolean;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClearFilters?: () => void;
}

/**
 * Vehicle List Table
 * 
 * Responsive component: Cards on mobile, table on desktop
 */
export function VehicleListTable({
  vehicles,
  isLoading = false,
  hasFilters = false,
  onView,
  onEdit,
  onDelete,
  onClearFilters,
}: VehicleListTableProps) {
  // Show empty state when not loading and no vehicles
  if (!isLoading && vehicles.length === 0) {
    return (
      <VehicleEmptyState
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  return (
    <>
      {/* Mobile Card View (< md) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          // Mobile loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="flex gap-4">
                <Skeleton className="h-24 w-24 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </div>
          ))
        ) : (
          vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="w-[80px]">Year</TableHead>
              <TableHead className="w-[120px]">Registration</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Price</TableHead>
              <TableHead className="w-[140px]">Location</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead className="w-[60px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>

          {isLoading ? (
            <VehicleListSkeleton />
          ) : (
            <TableBody>
              {vehicles.map((vehicle) => (
                <VehicleTableRow
                  key={vehicle.id}
                  vehicle={vehicle}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          )}
        </Table>
      </div>
    </>
  );
}

