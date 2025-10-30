"use client";

import { type VehicleListItem } from "~/types/vehicle";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Checkbox } from "~/components/ui/checkbox";
import { Skeleton } from "~/components/ui/skeleton";
import { VehicleTableRow } from "./VehicleTableRow";
import { VehicleCard } from "./VehicleCard";
import { VehicleListSkeleton } from "./VehicleListSkeleton";
import { VehicleEmptyState } from "./VehicleEmptyState";

interface VehicleListTableProps {
  vehicles: VehicleListItem[];
  isLoading?: boolean;
  hasFilters?: boolean;
  viewMode?: "table" | "cards";
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClearFilters?: () => void;
  selectedIds?: string[];
  onToggleVehicle?: (id: string) => void;
  onToggleAll?: (checked: boolean) => void;
  onCopyEmail?: (email: string) => void;
  onCopyPhone?: (phone: string) => void;
}

/**
 * Vehicle List Table
 * 
 * Responsive component with view mode toggle:
 * - Mobile: Always cards
 * - Desktop: Table or cards based on viewMode prop
 */
export function VehicleListTable({
  vehicles,
  isLoading = false,
  hasFilters = false,
  viewMode = "table",
  onView,
  onEdit,
  onDelete,
  onClearFilters,
  selectedIds = [],
  onToggleVehicle,
  onToggleAll,
  onCopyEmail,
  onCopyPhone,
}: VehicleListTableProps) {
  const allSelected = vehicles.length > 0 && selectedIds.length === vehicles.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < vehicles.length;
  // Show empty state when not loading and no vehicles
  if (!isLoading && vehicles.length === 0) {
    return (
      <VehicleEmptyState
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
      />
    );
  }

  // Card view skeleton
  const CardSkeleton = () => (
    <div className="rounded-lg border bg-card p-4">
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
  );

  return (
    <>
      {/* Mobile: Always Card View (< md) */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              selected={selectedIds.includes(vehicle.id)}
              onToggle={onToggleVehicle}
              onCopyEmail={onCopyEmail}
              onCopyPhone={onCopyPhone}
            />
          ))
        )}
      </div>

      {/* Desktop: Cards View (>= md) - when viewMode === "cards" */}
      {viewMode === "cards" && (
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
          ) : (
            vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onView={onView}
                onEdit={onEdit}
                onDelete={onDelete}
                selected={selectedIds.includes(vehicle.id)}
                onToggle={onToggleVehicle}
                onCopyEmail={onCopyEmail}
                onCopyPhone={onCopyPhone}
              />
            ))
          )}
        </div>
      )}

      {/* Desktop: Table View (>= md) - when viewMode === "table" */}
      {viewMode === "table" && (
        <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected || (someSelected ? "indeterminate" : false)}
                  onCheckedChange={(checked) => onToggleAll?.(checked === true)}
                  aria-label="Select all vehicles"
                />
              </TableHead>
              <TableHead className="w-[60px]">Image</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead className="w-[80px]">Year</TableHead>
              <TableHead className="w-[120px]">Registration</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[100px]">Price</TableHead>
              <TableHead className="w-[90px]">Hourly</TableHead>
              <TableHead className="w-[90px]">Daily</TableHead>
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
                  selected={selectedIds.includes(vehicle.id)}
                  onToggle={onToggleVehicle}
                  onCopyEmail={onCopyEmail}
                  onCopyPhone={onCopyPhone}
                />
              ))}
            </TableBody>
          )}
        </Table>
        </div>
      )}
    </>
  );
}

