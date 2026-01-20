"use client";

import { useEffect, useMemo, useRef, Suspense } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { usePublicVehicleFiltersContext } from "~/contexts/PublicVehicleFiltersContext";
import { PublicVehicleFilters } from "./_components/PublicVehicleFilters";
import { PublicVehicleBreadcrumbs } from "./_components/PublicVehicleBreadcrumbs";
import { PublicVehicleGrid } from "./_components/PublicVehicleGrid";
import { PageLoading } from "~/components/loading";
import { cn } from "~/lib/utils";
import { TYPOGRAPHY } from "~/lib/design-tokens";

interface VehicleData {
  vehicles: any[];
  items: any[];
  nextCursor?: string | undefined;
  totalCount: number;
}

interface PublicVehiclesCatalogContentProps {
  initialData: VehicleData;
  serverFilterOptions: any;
}

/**
 * Public Vehicles Catalogue Content
 * 
 * Displays published vehicles with filters.
 * Client component for interactivity with SSR initial data.
 */
function PublicVehiclesCatalogContent({ initialData, serverFilterOptions }: PublicVehiclesCatalogContentProps) {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = usePublicVehicleFiltersContext();

  // Pagination settings
  const itemsPerPage = 40;
  const skip = ((filters.page ?? 1) - 1) * itemsPerPage;

  // Fetch vehicles with initial data from server
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
      decadeIds: filters.decadeIds && filters.decadeIds.length > 0 ? filters.decadeIds : undefined,
      countryIds: filters.countryIds && filters.countryIds.length > 0 ? filters.countryIds : undefined,
      counties: filters.counties && filters.counties.length > 0 ? filters.counties : undefined,
      sortBy: filters.sortBy as "name" | "createdAt" | "updatedAt" | "year" | "distance",
      sortOrder: filters.sortOrder,
      includeTotalCount: true,
    },
    {
      staleTime: 30000, // 30 seconds
      // Use initial data from server-side render
      initialData: initialData as any,
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

  // Track previous page for scroll detection
  const previousPageRef = useRef<number>(filters.page ?? 1);
  const needsScrollRef = useRef<boolean>(false);

  // Scroll to top when page changes and data finishes loading
  useEffect(() => {
    const currentPage = filters.page ?? 1;
    const previousPage = previousPageRef.current;

    // Check if page changed
    if (previousPage !== currentPage) {
      previousPageRef.current = currentPage;
      needsScrollRef.current = true;
    }

    // Scroll when data has finished loading and we need to scroll
    if (needsScrollRef.current && !isFetching) {
      needsScrollRef.current = false;
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Use document.documentElement for better mobile compatibility
        if (document.documentElement) {
          document.documentElement.scrollTo({ top: 0, behavior: "auto" });
        } else {
          // Fallback to window.scrollTo
          window.scrollTo({ top: 0, behavior: "auto" });
        }
      });
    }
  }, [filters.page, isFetching]);

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: newPage });
  };

  const currentPage = filters.page ?? 1;

  return (
    <>
      {/* Hero Section */}
      <div className="bg-white">
        <div className=" pt-4 pb-10 md:pt-10 md:pb-16">
          <div className="max-w-[760px] flex flex-col gap-6">
            <h1 className="heading-1 uppercase text-black leading-[0.95]">
              explore classic cars for hire
            </h1>
            <p className={cn(TYPOGRAPHY.pageDescription, "text-black")}>
              Discover thousands of vehicles available to hire from action vehicles to wedding cars.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-6 md:gap-10">
        {/* Filters */}
        <PublicVehicleFilters />

        {/* Vehicle Grid */}
        <PublicVehicleGrid
          vehicles={vehicles}
          isLoading={isLoading}
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center px-8 py-16">
            <div className="flex items-center gap-4">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isFetching}
                className={cn(
                  "h-[40px] px-5 py-0 border border-black border-solid",
                  "font-degular text-[22px] font-normal leading-[1.3] tracking-[-0.22px]",
                  "transition-colors duration-150",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "hover:bg-spoke-black hover:text-spoke-white"
                )}
              >
                Previous
              </button>

              {/* Page Numbers - Desktop only */}
              <div className="hidden md:flex items-center gap-4">
                {/* First page */}
                {currentPage > 3 && (
                  <>
                    <button
                      type="button"
                      onClick={() => handlePageChange(1)}
                      disabled={isFetching}
                      className={cn(
                        "h-[40px] min-w-[30px] px-2 flex items-center justify-center border border-black border-solid",
                        "font-degular text-[22px] font-normal leading-[1.3] tracking-[-0.22px]",
                        "transition-colors duration-150",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        "hover:bg-spoke-black hover:text-spoke-white"
                      )}
                    >
                      1
                    </button>
                    {currentPage > 4 && (
                      <span className="font-degular text-2xl leading-[1.2] text-black">
                        ...
                      </span>
                    )}
                  </>
                )}

                {/* Pages around current */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return page >= currentPage - 2 && page <= currentPage + 2;
                  })
                  .map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => handlePageChange(page)}
                      disabled={isFetching}
                      className={cn(
                        "h-[40px] min-w-[30px] px-2 flex items-center justify-center border border-black border-solid",
                        "font-degular text-[22px] font-normal leading-[1.3] tracking-[-0.22px]",
                        "transition-colors duration-150",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        page === currentPage
                          ? "bg-spoke-black text-spoke-white"
                          : "hover:bg-spoke-black hover:text-spoke-white"
                      )}
                    >
                      {page}
                    </button>
                  ))}

                {/* Last page */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="font-degular text-2xl leading-[1.2] text-black">
                        ...
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={isFetching}
                      className={cn(
                        "h-[40px] min-w-[30px] px-2 flex items-center justify-center border border-black border-solid",
                        "font-degular text-[22px] font-normal leading-[1.3] tracking-[-0.22px]",
                        "transition-colors duration-150",
                        "disabled:opacity-40 disabled:cursor-not-allowed",
                        totalPages === currentPage
                          ? "bg-spoke-black text-spoke-white"
                          : "hover:bg-spoke-black hover:text-spoke-white"
                      )}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              {/* Page Indicator - Mobile only */}
              <div className="md:hidden px-3 py-1.5 text-sm font-medium text-muted-foreground">
                {currentPage} / {totalPages}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isFetching}
                className={cn(
                  "h-[40px] px-5 py-0 border border-black border-solid",
                  "font-degular text-[22px] font-normal leading-[1.3] tracking-[-0.22px]",
                  "transition-colors duration-150",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "hover:bg-spoke-black hover:text-spoke-white"
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/**
 * Public Vehicles Catalogue Page
 * 
 * Public-facing vehicle catalogue with SSR and SEO optimisation.
 * No authentication required.
 */
export default function PublicVehiclesPageContent({ initialData, serverFilterOptions }: PublicVehiclesCatalogContentProps) {
  return (
    <Suspense fallback={<PageLoading />}>
      <PublicVehiclesCatalogContent 
        initialData={initialData}
        serverFilterOptions={serverFilterOptions}
      />
    </Suspense>
  );
}

