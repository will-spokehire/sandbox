"use client";

import { useEffect, useState } from "react";
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
 * Vehicles List Page
 * 
 * Admin page for viewing and managing all vehicles
 */
export default function VehiclesPage() {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get filters from URL (default to PUBLISHED status)
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState<VehicleStatus | undefined>(
    (searchParams.get("status") as VehicleStatus) ?? "PUBLISHED"
  );
  const [makeIds, setMakeIds] = useState<string[]>(() => {
    const makeIdsParam = searchParams.get("makeIds");
    return makeIdsParam ? makeIdsParam.split(",") : [];
  });
  const [modelId, setModelId] = useState<string | undefined>(
    searchParams.get("modelId") ?? undefined
  );
  const [collectionIds, setCollectionIds] = useState<string[]>(() => {
    const collectionIdsParam = searchParams.get("collectionIds");
    return collectionIdsParam ? collectionIdsParam.split(",") : [];
  });
  const [exteriorColors, setExteriorColors] = useState<string[]>(() => {
    const exteriorColorsParam = searchParams.get("exteriorColors");
    return exteriorColorsParam ? exteriorColorsParam.split(",") : [];
  });
  const [interiorColors, setInteriorColors] = useState<string[]>(() => {
    const interiorColorsParam = searchParams.get("interiorColors");
    return interiorColorsParam ? interiorColorsParam.split(",") : [];
  });
  const [yearFrom, setYearFrom] = useState<string | undefined>(
    searchParams.get("yearFrom") ?? undefined
  );
  const [yearTo, setYearTo] = useState<string | undefined>(
    searchParams.get("yearTo") ?? undefined
  );
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allVehicles, setAllVehicles] = useState<VehicleListItem[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 300);

  // Fetch vehicles
  const {
    data,
    isLoading: isVehiclesLoading,
    isFetching,
    error,
    refetch,
  } = api.vehicle.list.useQuery(
    {
      limit: 20,
      cursor,
      search: debouncedSearch || undefined,
      status,
      makeIds: makeIds.length > 0 ? makeIds : undefined, // Multiple makes with OR logic
      modelId,
      collectionIds: collectionIds.length > 0 ? collectionIds : undefined, // Multiple collections with OR logic
      exteriorColors: exteriorColors.length > 0 ? exteriorColors : undefined, // Multiple exterior colors with OR logic
      interiorColors: interiorColors.length > 0 ? interiorColors : undefined, // Multiple interior colors with OR logic
      yearFrom,
      yearTo,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      enabled: !isAuthLoading && !!user,
    }
  );

  // Update all vehicles when data changes
  useEffect(() => {
    if (data?.vehicles) {
      if (cursor) {
        // Append to existing vehicles (load more)
        setAllVehicles((prev) => [...prev, ...data.vehicles]);
      } else {
        // Replace vehicles (new search/filter)
        setAllVehicles(data.vehicles);
      }
    }
  }, [data, cursor]);

  // Reset cursor when filters change
  useEffect(() => {
    setCursor(undefined);
    setAllVehicles([]);
  }, [debouncedSearch, status, makeIds, modelId, collectionIds, exteriorColors, interiorColors, yearFrom, yearTo]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (status) params.set("status", status);
    if (makeIds.length > 0) params.set("makeIds", makeIds.join(","));
    if (modelId) params.set("modelId", modelId);
    if (collectionIds.length > 0) params.set("collectionIds", collectionIds.join(","));
    if (exteriorColors.length > 0) params.set("exteriorColors", exteriorColors.join(","));
    if (interiorColors.length > 0) params.set("interiorColors", interiorColors.join(","));
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);

    const newUrl = params.toString() ? `?${params.toString()}` : "/admin/vehicles";
    router.push(newUrl, { scroll: false });
  }, [debouncedSearch, status, makeIds, modelId, collectionIds, exteriorColors, interiorColors, yearFrom, yearTo, router]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error("Failed to load vehicles", {
        description: error.message,
      });
    }
  }, [error]);

  // Handle view vehicle
  const handleView = (id: string) => {
    router.push(`/admin/vehicles/${id}`);
  };

  // Handle edit vehicle
  const handleEdit = (id: string) => {
    router.push(`/admin/vehicles/${id}/edit`);
  };

  // Handle delete vehicle
  const handleDelete = (id: string) => {
    // TODO: Implement delete confirmation dialog
    toast.info("Delete functionality coming soon");
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput("");
    setStatus(undefined);
    setMakeIds([]);
    setModelId(undefined);
    setCollectionIds([]);
    setExteriorColors([]);
    setInteriorColors([]);
    setYearFrom(undefined);
    setYearTo(undefined);
    setCursor(undefined);
    setAllVehicles([]);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (data?.nextCursor) {
      setCursor(data.nextCursor);
    }
  };

  // Check if any filters are active
  const hasFilters = !!(debouncedSearch || status || makeIds.length > 0 || modelId || collectionIds.length > 0 || exteriorColors.length > 0 || interiorColors.length > 0 || yearFrom || yearTo);

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
            onSearchChange={setSearchInput}
            onStatusChange={setStatus}
            onMakeIdsChange={setMakeIds}
            onModelChange={setModelId}
            onCollectionIdsChange={setCollectionIds}
            onExteriorColorsChange={setExteriorColors}
            onInteriorColorsChange={setInteriorColors}
            onYearFromChange={setYearFrom}
            onYearToChange={setYearTo}
            onClearFilters={handleClearFilters}
          />

          {/* Results Count & View Toggle */}
          {!isVehiclesLoading && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {data?.totalCount === 0 ? (
                  "No vehicles found"
                ) : (
                  <>
                    Found <span className="font-semibold text-slate-900 dark:text-slate-50">{data?.totalCount}</span> vehicle{data?.totalCount !== 1 ? "s" : ""}
                    {hasFilters && " matching your criteria"}
                    {allVehicles.length > 0 && allVehicles.length < (data?.totalCount ?? 0) && (
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
                  onClick={() => setViewMode("table")}
                  className="gap-2"
                >
                  <TableIcon className="h-4 w-4" />
                  Table
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
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
            isLoading={isVehiclesLoading && !cursor}
            hasFilters={hasFilters}
            viewMode={viewMode}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClearFilters={handleClearFilters}
          />

          {/* Load More Button */}
          {data?.nextCursor && (
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
                  `Load More (${data.totalCount - allVehicles.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

