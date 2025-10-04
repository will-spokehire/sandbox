"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VehicleStatus } from "@prisma/client";
import { LayoutGrid, Table as TableIcon } from "lucide-react";
import { toast } from "sonner";
import { useRequireAdmin } from "~/providers/auth-provider";
import { UserMenu } from "~/components/auth/UserMenu";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { useDebounce } from "~/hooks/useDebounce";
import { type VehicleListItem } from "~/types/vehicle";
import {
  VehicleListTable,
  VehicleFilters,
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

  // Read all state from URL - this is the ONLY source of truth
  const searchInput = searchParams.get("search") ?? "";
  const status = (searchParams.get("status") as VehicleStatus) ?? "PUBLISHED";
  const makeIds = searchParams.get("makeIds")?.split(",").filter(Boolean) ?? [];
  const modelId = searchParams.get("modelId") ?? undefined;
  const collectionIds = searchParams.get("collectionIds")?.split(",").filter(Boolean) ?? [];
  const exteriorColors = searchParams.get("exteriorColors")?.split(",").filter(Boolean) ?? [];
  const interiorColors = searchParams.get("interiorColors")?.split(",").filter(Boolean) ?? [];
  const yearFrom = searchParams.get("yearFrom") ?? undefined;
  const yearTo = searchParams.get("yearTo") ?? undefined;
  const viewMode = (searchParams.get("viewMode") as "table" | "cards") ?? "table";

  // Local state for pagination - not in URL to avoid reload issues
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allVehicles, setAllVehicles] = useState<VehicleListItem[]>([]);

  // Debounce search input for better UX
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch vehicles - 20 at a time with cursor-based pagination
  const {
    data,
    isLoading: isVehiclesLoading,
    isFetching,
    error,
  } = api.vehicle.list.useQuery(
    {
      limit: 20,
      cursor,
      search: debouncedSearch || undefined,
      status,
      makeIds: makeIds.length > 0 ? makeIds : undefined,
      modelId,
      collectionIds: collectionIds.length > 0 ? collectionIds : undefined,
      exteriorColors: exteriorColors.length > 0 ? exteriorColors : undefined,
      interiorColors: interiorColors.length > 0 ? interiorColors : undefined,
      yearFrom,
      yearTo,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      enabled: !isAuthLoading && !!user,
    }
  );

  const totalCount = data?.totalCount ?? 0;
  const hasMore = data?.nextCursor !== undefined;

  // Update vehicles list when data changes
  useEffect(() => {
    if (data?.vehicles) {
      if (cursor) {
        // Append for pagination (Load More)
        setAllVehicles((prev: VehicleListItem[]) => [...prev, ...data.vehicles]);
      } else {
        // Replace for new search/filter or initial load
        setAllVehicles(data.vehicles);
      }
    }
  }, [data, cursor]);

  // Reset pagination cursor when filters change
  useEffect(() => {
    setCursor(undefined);
  }, [debouncedSearch, status, makeIds.join(","), modelId, collectionIds.join(","), exteriorColors.join(","), interiorColors.join(","), yearFrom, yearTo]);

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
    viewMode?: "table" | "cards";
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    // Apply updates
    if (updates.search !== undefined) {
      updates.search ? params.set("search", updates.search) : params.delete("search");
    }
    if (updates.status !== undefined) {
      updates.status ? params.set("status", updates.status) : params.delete("status");
    }
    if (updates.makeIds !== undefined) {
      updates.makeIds.length > 0 ? params.set("makeIds", updates.makeIds.join(",")) : params.delete("makeIds");
    }
    if (updates.modelId !== undefined) {
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
    if (updates.yearFrom !== undefined) {
      updates.yearFrom ? params.set("yearFrom", updates.yearFrom) : params.delete("yearFrom");
    }
    if (updates.yearTo !== undefined) {
      updates.yearTo ? params.set("yearTo", updates.yearTo) : params.delete("yearTo");
    }
    if (updates.viewMode !== undefined) {
      updates.viewMode !== "table" ? params.set("viewMode", updates.viewMode) : params.delete("viewMode");
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
    // Clear all filters at once
    router.push("/admin/vehicles?status=PUBLISHED", { scroll: false });
  };

  const handleLoadMore = () => {
    // Set cursor to fetch next page
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  // Check if any filters are active
  const hasFilters = !!(searchInput || status !== "PUBLISHED" || makeIds.length > 0 || modelId || collectionIds.length > 0 || exteriorColors.length > 0 || interiorColors.length > 0 || yearFrom || yearTo);

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
                Vehicles
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400">
                Manage vehicle listings
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/admin")}
                className="hidden sm:flex"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/admin")}
                className="sm:hidden"
              >
                ←
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Filters */}
          <VehicleFilters
            search={searchInput}
            status={status}
            makeIds={makeIds}
            modelId={modelId}
            collectionIds={collectionIds}
            exteriorColors={exteriorColors}
            interiorColors={interiorColors}
            yearFrom={yearFrom}
            yearTo={yearTo}
            onSearchChange={(search) => updateURL({ search })}
            onStatusChange={(status) => updateURL({ status })}
            onMakeIdsChange={(makeIds) => updateURL({ makeIds })}
            onModelChange={(modelId) => updateURL({ modelId })}
            onCollectionIdsChange={(collectionIds) => updateURL({ collectionIds })}
            onExteriorColorsChange={(exteriorColors) => updateURL({ exteriorColors })}
            onInteriorColorsChange={(interiorColors) => updateURL({ interiorColors })}
            onYearFromChange={(yearFrom) => updateURL({ yearFrom })}
            onYearToChange={(yearTo) => updateURL({ yearTo })}
            onClearFilters={handleClearFilters}
          />

          {/* Results Count & View Toggle */}
          {!isVehiclesLoading && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {totalCount === 0 ? (
                  "No vehicles found"
                ) : (
                  <>
                    Found <span className="font-semibold text-slate-900 dark:text-slate-50">{totalCount}</span> vehicle{totalCount !== 1 ? "s" : ""}
                    {hasFilters && " matching your criteria"}
                    {allVehicles.length > 0 && allVehicles.length < totalCount && (
                      <span className="ml-2">
                        (Showing <span className="font-semibold">{allVehicles.length}</span>)
                      </span>
                    )}
                  </>
                )}
              </p>
              
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
            vehicles={allVehicles}
            isLoading={isVehiclesLoading}
            hasFilters={hasFilters}
            viewMode={viewMode}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClearFilters={handleClearFilters}
          />

          {/* Load More Button */}
          {hasMore && !isVehiclesLoading && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isFetching}
                className="min-w-[200px]"
              >
                {isFetching ? (
                  <>
                    <div className="h-4 w-4 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin mr-2" />
                    Loading...
                  </>
                ) : (
                  `Load More (${totalCount - allVehicles.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-600">Loading vehicles...</p>
          </div>
        </div>
      }
    >
      <VehiclesPageContent />
    </Suspense>
  );
}
