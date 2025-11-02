"use client";

import { useEffect, useMemo, Suspense } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { usePublicVehicleFiltersContext } from "~/contexts/PublicVehicleFiltersContext";
import { usePublicVehiclePageTitle } from "~/hooks/usePublicVehiclePageTitle";
import { PublicVehicleFilters } from "./_components/PublicVehicleFilters";
import { PublicVehicleBreadcrumbs } from "./_components/PublicVehicleBreadcrumbs";
import { PublicVehicleGrid } from "./_components/PublicVehicleGrid";
import { Button } from "~/components/ui/button";
import { PageLoading } from "~/components/loading";

/**
 * Public Vehicles Catalog Content
 * 
 * Displays published vehicles with filters.
 * Client component for interactivity.
 */
function PublicVehiclesCatalogContent() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = usePublicVehicleFiltersContext();
  
  // Generate dynamic page titles based on filters
  const { h1, h2 } = usePublicVehiclePageTitle(filters);

  // Pagination settings
  const itemsPerPage = 30;
  const skip = ((filters.page ?? 1) - 1) * itemsPerPage;

  // Fetch vehicles
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = api.publicVehicle.list.useQuery(
    {
      limit: itemsPerPage,
      skip,
      makeIds: filters.makeIds && filters.makeIds.length > 0 ? filters.makeIds : undefined,
      modelId: filters.modelId,
      collectionIds: filters.collectionIds && filters.collectionIds.length > 0 ? filters.collectionIds : undefined,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      countryIds: filters.countryIds && filters.countryIds.length > 0 ? filters.countryIds : undefined,
      counties: filters.counties && filters.counties.length > 0 ? filters.counties : undefined,
      sortBy: filters.sortBy as "name" | "createdAt" | "updatedAt" | "year" | "distance",
      sortOrder: filters.sortOrder,
      includeTotalCount: true,
    },
    {
      staleTime: 30000, // 30 seconds
    }
  );

  const vehicles = useMemo(() => (data?.vehicles ?? []) as any[], [data?.vehicles]);
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

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              {h1}
            </h1>
            <h2 className="text-xl md:text-2xl text-muted-foreground font-medium">
              {h2}
            </h2>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="space-y-6">
          {/* Breadcrumbs - Show active filters path */}
          <PublicVehicleBreadcrumbs />

          {/* Filters */}
          <PublicVehicleFilters />

          {/* Results Count */}
          {!isLoading && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {totalCount === 0 ? (
                  "No vehicles found"
                ) : (
                  <>
                    Found <span className="font-semibold text-foreground">{totalCount}</span> vehicle{totalCount !== 1 ? "s" : ""}
                    {hasActiveFilters && " matching your criteria"}
                    {totalPages > 1 && (
                      <span className="ml-2">
                        (Page <span className="font-semibold">{filters.page ?? 1}</span> of <span className="font-semibold">{totalPages}</span>)
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
          )}

          {/* Vehicle Grid */}
          <PublicVehicleGrid
            vehicles={vehicles}
            isLoading={isLoading}
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
          />

          {/* Pagination */}
          {totalPages > 1 && !isLoading && (
            <div className="flex items-center justify-center gap-2 pt-6">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange((filters.page ?? 1) - 1)}
                disabled={(filters.page ?? 1) === 1 || isFetching}
              >
                Previous
              </Button>

              {/* Page Numbers - Desktop only */}
              <div className="hidden md:flex items-center gap-1">
                {/* First page */}
                {(filters.page ?? 1) > 3 && (
                  <>
                    <Button
                      variant={1 === (filters.page ?? 1) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={isFetching}
                      className="w-10"
                    >
                      1
                    </Button>
                    {(filters.page ?? 1) > 4 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                  </>
                )}

                {/* Pages around current */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    // Show current page and 2 pages on each side
                    return page >= (filters.page ?? 1) - 2 && page <= (filters.page ?? 1) + 2;
                  })
                  .map((page) => (
                    <Button
                      key={page}
                      variant={page === (filters.page ?? 1) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      disabled={isFetching}
                      className="w-10"
                    >
                      {page}
                    </Button>
                  ))}

                {/* Last page */}
                {(filters.page ?? 1) < totalPages - 2 && (
                  <>
                    {(filters.page ?? 1) < totalPages - 3 && (
                      <span className="px-2 text-muted-foreground">...</span>
                    )}
                    <Button
                      variant={totalPages === (filters.page ?? 1) ? "default" : "outline"}
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
                {filters.page ?? 1} / {totalPages}
              </div>

              {/* Next Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange((filters.page ?? 1) + 1)}
                disabled={(filters.page ?? 1) === totalPages || isFetching}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Public Vehicles Catalog Page
 * 
 * Public-facing vehicle catalog with SEO optimization.
 * No authentication required.
 */
export default function PublicVehiclesPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PublicVehiclesCatalogContent />
    </Suspense>
  );
}

