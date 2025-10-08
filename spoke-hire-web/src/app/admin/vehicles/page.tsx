"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VehicleStatus } from "@prisma/client";
import { LayoutGrid, Table as TableIcon, Send } from "lucide-react";
import { toast } from "sonner";
import { useRequireAdmin } from "~/providers/auth-provider";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { type VehicleListItem } from "~/types/vehicle";
import { PageHeader } from "~/app/_components/ui";
import {
  VehicleListTable,
  VehicleFilters,
  CreateDealDialog,
} from "./_components";

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
  const searchParams = useSearchParams();

  // Vehicle selection state for deals
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([]);
  const [isCreateDealDialogOpen, setIsCreateDealDialogOpen] = useState(false);

  // Read all state from URL - this is the ONLY source of truth
  const searchInput = searchParams.get("search") ?? "";
  // Default to PUBLISHED if no status in URL (first visit or cleared filters)
  // "ALL" is a special value meaning show all statuses
  const status = (searchParams.get("status") as VehicleStatus | "ALL" | null) ?? "PUBLISHED";
  const makeIds = searchParams.get("makeIds")?.split(",").filter(Boolean) ?? [];
  const modelId = searchParams.get("modelId") ?? undefined;
  const collectionIds = searchParams.get("collectionIds")?.split(",").filter(Boolean) ?? [];
  const exteriorColors = searchParams.get("exteriorColors")?.split(",").filter(Boolean) ?? [];
  const interiorColors = searchParams.get("interiorColors")?.split(",").filter(Boolean) ?? [];
  const yearFrom = searchParams.get("yearFrom") ?? undefined;
  const yearTo = searchParams.get("yearTo") ?? undefined;
  const numberOfSeats = searchParams.get("numberOfSeats")?.split(",").filter(Boolean).map(Number) ?? [];
  const gearboxTypes = searchParams.get("gearboxTypes")?.split(",").filter(Boolean) ?? [];
  const steeringIds = searchParams.get("steeringIds")?.split(",").filter(Boolean) ?? [];
  const countryIds = searchParams.get("countryIds")?.split(",").filter(Boolean) ?? [];
  const counties = searchParams.get("counties")?.split(",").filter(Boolean) ?? [];
  const postcode = searchParams.get("postcode") ?? undefined;
  const maxDistance = searchParams.get("maxDistance") ? parseInt(searchParams.get("maxDistance")!) : undefined;
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc";
  const sortByDistance = searchParams.get("sortByDistance") === "true" || sortBy === "distance";
  const viewMode = (searchParams.get("viewMode") as "table" | "cards") ?? "table";
  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);

  // Debounce search input for better UX
  const debouncedSearch = useDebounce(searchInput, 300);

  // Pagination settings
  const itemsPerPage = 30;
  const skip = (currentPage - 1) * itemsPerPage;

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
      search: debouncedSearch || undefined,
      // Don't pass status if it's "ALL" (show all statuses)
      status: status === "ALL" ? undefined : status,
      makeIds: makeIds.length > 0 ? makeIds : undefined,
      modelId,
      collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
      exteriorColors: exteriorColors.length > 0 ? exteriorColors : undefined,
      interiorColors: interiorColors.length > 0 ? interiorColors : undefined,
      yearFrom,
      yearTo,
      numberOfSeats: numberOfSeats.length > 0 ? numberOfSeats : undefined,
      gearboxTypes: gearboxTypes.length > 0 ? gearboxTypes : undefined,
      steeringIds: steeringIds.length > 0 ? steeringIds : undefined,
      countryIds: countryIds.length > 0 ? countryIds : undefined,
      counties: counties.length > 0 ? counties : undefined,
      userPostcode: postcode,
      maxDistanceMiles: maxDistance,
      sortByDistance,
      sortBy: sortBy as any,
      sortOrder,
      // OPTIMIZATION: Only get count on first page
      includeTotalCount: currentPage === 1,
    },
    {
      enabled: !isAuthLoading && !!user,
      // Add stale time to reduce refetches
      staleTime: 30000, // 30 seconds
    }
  );

  const vehicles = data?.vehicles ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load vehicles", {
        description: error.message,
      });
    }
  }, [error]);

  /**
   * Update URL with new filter values
   * This is the key function - all state changes go through URL updates
   */
  const updateURL = (updates: {
    search?: string;
    status?: VehicleStatus;
    makeIds?: string[];
    modelId?: string;
    collectionIds?: string[];
    exteriorColors?: string[];
    interiorColors?: string[];
    yearFrom?: string;
    yearTo?: string;
    numberOfSeats?: number[];
    gearboxTypes?: string[];
    steeringIds?: string[];
    countryIds?: string[];
    counties?: string[];
    postcode?: string;
    maxDistance?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    sortByDistance?: boolean;
    viewMode?: "table" | "cards";
    page?: number;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    if (updates.search !== undefined) {
      updates.search ? params.set("search", updates.search) : params.delete("search");
    }
    if ("status" in updates) {
      updates.status ? params.set("status", updates.status) : params.delete("status");
    }
    if (updates.makeIds !== undefined) {
      updates.makeIds.length > 0 ? params.set("makeIds", updates.makeIds.join(",")) : params.delete("makeIds");
    }
    if ("modelId" in updates) {
      updates.modelId ? params.set("modelId", updates.modelId) : params.delete("modelId");
    }
    if (updates.collectionIds !== undefined) {
      updates.collectionIds.length > 0 ? params.set("collectionIds", updates.collectionIds.join(",")) : params.delete("collectionIds");
    }
    if (updates.exteriorColors !== undefined) {
      updates.exteriorColors.length > 0 ? params.set("exteriorColors", updates.exteriorColors.join(",")) : params.delete("exteriorColors");
    }
    if (updates.interiorColors !== undefined) {
      updates.interiorColors.length > 0 ? params.set("interiorColors", updates.interiorColors.join(",")) : params.delete("interiorColors");
    }
    if ("yearFrom" in updates) {
      updates.yearFrom ? params.set("yearFrom", updates.yearFrom) : params.delete("yearFrom");
    }
    if ("yearTo" in updates) {
      updates.yearTo ? params.set("yearTo", updates.yearTo) : params.delete("yearTo");
    }
    if (updates.numberOfSeats !== undefined) {
      updates.numberOfSeats.length > 0 ? params.set("numberOfSeats", updates.numberOfSeats.join(",")) : params.delete("numberOfSeats");
    }
    if (updates.gearboxTypes !== undefined) {
      updates.gearboxTypes.length > 0 ? params.set("gearboxTypes", updates.gearboxTypes.join(",")) : params.delete("gearboxTypes");
    }
    if (updates.steeringIds !== undefined) {
      updates.steeringIds.length > 0 ? params.set("steeringIds", updates.steeringIds.join(",")) : params.delete("steeringIds");
    }
    if (updates.countryIds !== undefined) {
      updates.countryIds.length > 0 ? params.set("countryIds", updates.countryIds.join(",")) : params.delete("countryIds");
    }
    if (updates.counties !== undefined) {
      updates.counties.length > 0 ? params.set("counties", updates.counties.join(",")) : params.delete("counties");
    }
    if ("postcode" in updates) {
      updates.postcode ? params.set("postcode", updates.postcode) : params.delete("postcode");
    }
    if ("maxDistance" in updates) {
      updates.maxDistance ? params.set("maxDistance", updates.maxDistance.toString()) : params.delete("maxDistance");
    }
    if (updates.sortBy !== undefined) {
      updates.sortBy !== "createdAt" ? params.set("sortBy", updates.sortBy) : params.delete("sortBy");
    }
    if (updates.sortOrder !== undefined) {
      updates.sortOrder !== "desc" ? params.set("sortOrder", updates.sortOrder) : params.delete("sortOrder");
    }
    if (updates.sortByDistance !== undefined) {
      updates.sortByDistance ? params.set("sortByDistance", "true") : params.delete("sortByDistance");
    }
    if (updates.viewMode !== undefined) {
      updates.viewMode !== "table" ? params.set("viewMode", updates.viewMode) : params.delete("viewMode");
    }
    if (updates.page !== undefined) {
      updates.page > 1 ? params.set("page", updates.page.toString()) : params.delete("page");
    }

    // When filters change, reset to page 1
    const isFilterChange = updates.search !== undefined || updates.status !== undefined || 
                          updates.makeIds !== undefined || updates.modelId !== undefined ||
                          updates.collectionIds !== undefined || updates.exteriorColors !== undefined ||
                          updates.interiorColors !== undefined || updates.yearFrom !== undefined ||
                          updates.yearTo !== undefined || updates.numberOfSeats !== undefined ||
                          updates.gearboxTypes !== undefined || updates.steeringIds !== undefined ||
                          updates.postcode !== undefined || updates.maxDistance !== undefined;
    
    if (isFilterChange && updates.page === undefined) {
      params.delete("page"); // Reset to page 1 when filters change
    }

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/vehicles";
    router.push(newUrl, { scroll: false });
  };

  // Navigation handlers - just use regular router.push
  const handleView = (id: string) => {
    router.push(`/admin/vehicles/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/vehicles/${id}/edit`);
  };

  const handleDelete = (id: string) => {
    toast.info("Delete functionality coming soon");
  };

  const handleClearFilters = () => {
    // Clear all filters and reset to default PUBLISHED status
    router.push("/admin/vehicles?status=PUBLISHED", { scroll: false });
  };

  const handlePageChange = (page: number) => {
    updateURL({ page });
    // Scroll to top of list smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Vehicle selection handlers
  const handleToggleVehicle = useCallback((vehicleId: string) => {
    setSelectedVehicleIds((prev) =>
      prev.includes(vehicleId)
        ? prev.filter((id) => id !== vehicleId)
        : [...prev, vehicleId]
    );
  }, []);

  const handleToggleAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedVehicleIds(vehicles.map((v) => v.id));
    } else {
      setSelectedVehicleIds([]);
    }
  }, [vehicles]);

  const handleSendDeal = useCallback(() => {
    if (selectedVehicleIds.length === 0) {
      toast.error("Please select at least one vehicle");
      return;
    }
    setIsCreateDealDialogOpen(true);
  }, [selectedVehicleIds]);

  const handleDealCreated = useCallback(() => {
    setSelectedVehicleIds([]);
    setIsCreateDealDialogOpen(false);
    toast.success("Deal sent successfully!");
  }, []);

  // Check if any filters are active (PUBLISHED is the default, so not counted as a filter)
  const hasFilters = !!(searchInput || (status && status !== "PUBLISHED") || makeIds.length > 0 || modelId || collectionIds.length > 0 || exteriorColors.length > 0 || interiorColors.length > 0 || yearFrom || yearTo || numberOfSeats.length > 0 || gearboxTypes.length > 0 || steeringIds.length > 0 || countryIds.length > 0 || counties.length > 0 || postcode || maxDistance);

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
      <VehicleFilters
            search={searchInput}
            status={status === "ALL" ? undefined : status}
            makeIds={makeIds}
            modelId={modelId}
            collectionIds={collectionIds}
            exteriorColors={exteriorColors}
            interiorColors={interiorColors}
            yearFrom={yearFrom}
            yearTo={yearTo}
            numberOfSeats={numberOfSeats}
            gearboxTypes={gearboxTypes}
            steeringIds={steeringIds}
            countryIds={countryIds}
            counties={counties}
            postcode={postcode}
            maxDistance={maxDistance}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSearchChange={(search) => updateURL({ search })}
            onStatusChange={(status) => updateURL({ status })}
            onMakeIdsChange={(makeIds) => updateURL({ makeIds })}
            onModelChange={(modelId) => updateURL({ modelId })}
            onCollectionIdsChange={(collectionIds) => updateURL({ collectionIds })}
            onExteriorColorsChange={(exteriorColors) => updateURL({ exteriorColors })}
            onInteriorColorsChange={(interiorColors) => updateURL({ interiorColors })}
            onNumberOfSeatsChange={(numberOfSeats) => updateURL({ numberOfSeats })}
            onGearboxTypesChange={(gearboxTypes) => updateURL({ gearboxTypes })}
            onSteeringIdsChange={(steeringIds) => updateURL({ steeringIds })}
            onCountryIdsChange={(countryIds) => updateURL({ countryIds })}
            onCountiesChange={(counties) => updateURL({ counties })}
            onYearFromChange={(yearFrom) => updateURL({ yearFrom })}
            onYearToChange={(yearTo) => updateURL({ yearTo })}
            onPostcodeChange={(postcode) => updateURL({ postcode })}
            onMaxDistanceChange={(maxDistance) => updateURL({ maxDistance })}
            onPostcodeAndDistanceChange={(postcode, maxDistance) => updateURL({ postcode, maxDistance })}
            onSortChange={(sortBy, sortOrder) => updateURL({ sortBy, sortOrder })}
            onClearFilters={handleClearFilters}
          />

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
                  {hasFilters && " matching your criteria"}
                  {totalPages > 1 && (
                    <span className="ml-2">
                      (Page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span>)
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
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary-foreground/20 rounded">
                  {selectedVehicleIds.length}
                </span>
              </Button>
            )}
          </div>
          
          {/* Desktop View Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => updateURL({ viewMode: "table" })}
              className="gap-2"
            >
              <TableIcon className="h-4 w-4" />
              Table
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => updateURL({ viewMode: "cards" })}
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
        hasFilters={hasFilters}
        viewMode={viewMode}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClearFilters={handleClearFilters}
        selectedIds={selectedVehicleIds}
        onToggleVehicle={handleToggleVehicle}
        onToggleAll={handleToggleAll}
      />

      {/* Pagination */}
      {totalPages > 1 && !isVehiclesLoading && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isFetching}
          >
            Previous
          </Button>

          {/* Page Numbers - Desktop only */}
          <div className="hidden md:flex items-center gap-1">
            {/* First page */}
            {currentPage > 3 && (
              <>
                <Button
                  variant={1 === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(1)}
                  disabled={isFetching}
                  className="w-10"
                >
                  1
                </Button>
                {currentPage > 4 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
              </>
            )}

            {/* Pages around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                // Show current page and 2 pages on each side
                return page >= currentPage - 2 && page <= currentPage + 2;
              })
              .map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  disabled={isFetching}
                  className="w-10"
                >
                  {page}
                </Button>
              ))}

            {/* Last page */}
            {currentPage < totalPages - 2 && (
              <>
                {currentPage < totalPages - 3 && (
                  <span className="px-2 text-muted-foreground">...</span>
                )}
                <Button
                  variant={totalPages === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(totalPages)}
                  disabled={isFetching}
                  className="w-10"
                >
                  {totalPages}
                </Button>
              </>
            )}
          </div>

          {/* Page Indicator - Mobile only */}
          <div className="md:hidden px-3 py-1.5 text-sm font-medium text-muted-foreground">
            {currentPage} / {totalPages}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isFetching}
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Deal Dialog - Only mount when needed */}
      {isCreateDealDialogOpen && (
        <CreateDealDialog
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
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-[400px] w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
      }
    >
      <VehiclesPageContent />
    </Suspense>
  );
}
