"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid, Table as TableIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { useRequireAdmin } from "~/providers/auth-provider";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { useVehicleSelection } from "~/hooks/useVehicleSelection";
import { useVehiclePagination } from "~/hooks/useVehiclePagination";
import { PageHeader, Pagination } from "~/app/_components/ui";
import { PageLoading } from "~/components/loading";
import { VehicleFiltersProvider, useVehicleFiltersContext } from "~/contexts";
import {
  VehicleListTable,
  VehicleFilters,
} from "./_components";
import { SendDealToVehiclesDialog } from "~/components/deals";

/**
 * Vehicles List Page Content
 * 
 * Best Practice Approach:
 * - URL is the single source of truth for all state
 * - Uses "Load More" pattern that persists in URL via page number
 * - Browser back/forward works automatically
 * - State is shareable via URL
 */
function VehiclesPageContent() {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();

  // Vehicle selection state for deals
  const [isCreateDealDialogOpen, setIsCreateDealDialogOpen] = useState(false);

  // Use custom hooks for state management
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useVehicleFiltersContext();
  const { 
    selectedIds: selectedVehicleIds, 
    toggleVehicle, 
    toggleAll, 
    clearSelection 
  } = useVehicleSelection();

  // Debounce search input for better UX
  const debouncedSearch = useDebounce(filters.search ?? "", 300);

  // Pagination settings
  const itemsPerPage = 30;

  // Calculate skip for pagination
  const skip = ((filters.page ?? 1) - 1) * itemsPerPage;

  // Fetch vehicles with offset-based pagination
  const {
    data,
    isLoading: isVehiclesLoading,
    isFetching,
    error,
  } = api.vehicle.list.useQuery(
    {
      limit: itemsPerPage,
      cursor: undefined, // Not using cursor for offset pagination
      skip, // Add skip parameter for offset
      search: debouncedSearch ?? undefined,
      // Don't pass status if it's "ALL" (show all statuses)
      status: filters.status === "ALL" ? undefined : filters.status,
      makeIds: filters.makeIds && filters.makeIds.length > 0 ? filters.makeIds : undefined,
      modelId: filters.modelId,
      collectionIds: filters.collectionIds && filters.collectionIds.length > 0 ? filters.collectionIds : undefined,
      exteriorColors: filters.exteriorColors && filters.exteriorColors.length > 0 ? filters.exteriorColors : undefined,
      interiorColors: filters.interiorColors && filters.interiorColors.length > 0 ? filters.interiorColors : undefined,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      numberOfSeats: filters.numberOfSeats && filters.numberOfSeats.length > 0 ? filters.numberOfSeats : undefined,
      gearboxTypes: filters.gearboxTypes && filters.gearboxTypes.length > 0 ? filters.gearboxTypes : undefined,
      steeringIds: filters.steeringIds && filters.steeringIds.length > 0 ? filters.steeringIds : undefined,
      countryIds: filters.countryIds && filters.countryIds.length > 0 ? filters.countryIds : undefined,
      counties: filters.counties && filters.counties.length > 0 ? filters.counties : undefined,
      userPostcode: filters.postcode,
      maxDistanceMiles: filters.maxDistance,
      sortByDistance: filters.sortByDistance,
      sortBy: filters.sortBy as "name" | "createdAt" | "updatedAt" | "price" | "year" | "distance",
      sortOrder: filters.sortOrder,
      // Always fetch total count to ensure pagination works on all pages
      includeTotalCount: true,
    },
    {
      enabled: !isAuthLoading && !!user,
      // Add stale time to reduce refetches
      staleTime: 30000, // 30 seconds
    }
  );

  const vehicles = useMemo(() => (data?.vehicles ?? []) as any[], [data?.vehicles]);
  const totalCount = data?.totalCount ?? 0;

  // Get pagination info after data is available
  const { totalPages, handlePageChange } = useVehiclePagination(
    {
      itemsPerPage,
      totalCount,
      currentPage: filters.page ?? 1,
    },
    (page) => updateFilters({ page })
  );

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load vehicles", {
        description: error.message,
      });
    }
  }, [error]);


  // Navigation handlers - just use regular router.push
  const handleView = (id: string) => {
    router.push(`/admin/vehicles/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/vehicles/${id}/edit`);
  };

  const handleDelete = (_id: string) => {
    toast.info("Delete functionality coming soon");
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const handleCopyEmail = (email: string) => {
    void copyToClipboard(email, 'Email');
  };

  const handleCopyPhone = (phone: string) => {
    void copyToClipboard(phone, 'Phone number');
  };

  // Vehicle selection handlers
  const handleToggleAll = useCallback((checked: boolean) => {
    toggleAll(checked, vehicles.map((v) => v.id));
  }, [vehicles, toggleAll]);

  const handleSendDeal = useCallback(() => {
    if (selectedVehicleIds.length === 0) {
      toast.error("Please select at least one vehicle");
      return;
    }
    setIsCreateDealDialogOpen(true);
  }, [selectedVehicleIds]);

  const handleDealCreated = useCallback(() => {
    clearSelection();
    setIsCreateDealDialogOpen(false);
    toast.success("Added to deal successfully!");
  }, [clearSelection]);


  if (isAuthLoading || !user) {
    return null; // Layout handles loading state
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicles"
        description="Manage vehicle listings"
      />

      {/* Filters */}
      <VehicleFilters />

      {/* Action Bar: Results Count, Send Deal Button & View Toggle */}
      {!isVehiclesLoading && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {totalCount === 0 ? (
                "No vehicles found"
              ) : (
                <>
                  Found <span className="font-semibold text-slate-900 dark:text-slate-50">{totalCount}</span> vehicle{totalCount !== 1 ? "s" : ""}
                  {hasActiveFilters && " matching your criteria"}
                  {totalPages > 1 && (
                    <span className="ml-2">
                      (Page <span className="font-semibold">{filters.page ?? 1}</span> of <span className="font-semibold">{totalPages}</span>)
                    </span>
                  )}
                </>
              )}
            </p>
            
            {/* Send Deal Button - Appears when vehicles are selected */}
            {selectedVehicleIds.length > 0 && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSendDeal}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Send Deal</span>
                <span className="sm:hidden">Send</span>
                <span className="ml-1 px-1.5 py-0.5 body-xs bg-primary-foreground/20 rounded">
                  {selectedVehicleIds.length}
                </span>
              </Button>
            )}
          </div>
          
          {/* Desktop View Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={filters.viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ viewMode: "table" })}
              className="gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={filters.viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilters({ viewMode: "cards" })}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </Button>
          </div>
        </div>
      )}

      {/* Table/Cards */}
      <VehicleListTable
        vehicles={vehicles}
        isLoading={isVehiclesLoading}
        hasFilters={hasActiveFilters}
        viewMode={filters.viewMode}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClearFilters={clearFilters}
        selectedIds={selectedVehicleIds}
        onToggleVehicle={toggleVehicle}
        onToggleAll={handleToggleAll}
        onCopyEmail={handleCopyEmail}
        onCopyPhone={handleCopyPhone}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={filters.page ?? 1}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          isLoading={isFetching}
        />
      )}

      {/* Create Deal Dialog - Only mount when needed */}
      {isCreateDealDialogOpen && (
        <SendDealToVehiclesDialog
          open={isCreateDealDialogOpen}
          onOpenChange={setIsCreateDealDialogOpen}
          selectedVehicleIds={selectedVehicleIds}
          onSuccess={handleDealCreated}
        />
      )}
    </div>
  );
}

/**
 * Vehicles Page with Suspense Boundary
 * 
 * Wraps the main content in Suspense to handle useSearchParams() properly
 */
export default function VehiclesPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <VehicleFiltersProvider>
        <VehiclesPageContent />
      </VehicleFiltersProvider>
    </Suspense>
  );
}
