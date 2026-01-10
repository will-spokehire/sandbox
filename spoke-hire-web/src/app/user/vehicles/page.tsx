'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useRequireAuth } from '~/providers/auth-provider';
import { api } from '~/trpc/react';
import { useURLFilters } from '~/hooks/useURLFilters';
import { Button } from '~/components/ui/button';
import { VehicleStatusTabs } from './_components/VehicleStatusTabs';
import { UserVehicleGrid } from './_components/UserVehicleGrid';
import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardContent } from '~/components/ui/card';
import { z } from 'zod';
import type { VehicleStatus } from '@prisma/client';
import { TYPOGRAPHY } from '~/lib/design-tokens';
import { cn } from '~/lib/utils';

// Filter schema for URL-based filter management
const userVehicleFiltersSchema = z.object({
  status: z.enum(['ALL_ACTIVE', 'DRAFT', 'IN_REVIEW', 'PUBLISHED', 'DECLINED', 'ARCHIVED']).default('ALL_ACTIVE'),
});

type UserVehicleFilters = z.infer<typeof userVehicleFiltersSchema>;

const defaultFilters: UserVehicleFilters = {
  status: 'ALL_ACTIVE',
};

/**
 * User Vehicles List Page Content
 * 
 * Wrapped component that uses useSearchParams
 */
function UserVehiclesPageContent() {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  
  // URL-based filter management - persists across page reloads
  const { filters, updateFilters } = useURLFilters(
    userVehicleFiltersSchema,
    defaultFilters,
    '/user/vehicles'
  );

  // Fetch user's vehicles with URL-based filter
  const {
    data: vehiclesData,
    isLoading: isVehiclesLoading,
    error,
  } = api.userVehicle.myVehicles.useQuery(
    {
      limit: 50,
      status: filters.status === 'ALL_ACTIVE' ? undefined : (filters.status as VehicleStatus),
    },
    {
      enabled: !isAuthLoading && !!user,
    }
  );

  // Fetch vehicle counts
  const { data: counts } = api.userVehicle.myVehicleCounts.useQuery(
    undefined,
    {
      enabled: !isAuthLoading && !!user,
    }
  );

  // Show loading state with skeleton
  if (isAuthLoading || isVehiclesLoading) {
    return (
      <>
        {/* Header Skeleton */}
        <div className="bg-white">
          <div className="py-4 md:py-10">
            <Skeleton className="h-12 md:h-24 w-64 md:w-96 mb-[11px]" />
            <Skeleton className="h-5 w-48 md:w-64" />
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-white">
          <div className="py-8">
            {/* Tabs Skeleton */}
            <div className="mb-8">
              <Skeleton className="h-10 w-full max-w-md" />
            </div>

            {/* Vehicle Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="pt-3 p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <Skeleton className="h-5 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        {/* Header */}
        <div className="bg-white">
          <div className=" py-4 md:py-10">
            <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal">
              My Vehicles
            </h1>
          </div>
        </div>

        {/* Error Content */}
        <main className="flex-1 bg-white">
          <div className="py-4 md:py-8">
            <div className="text-center py-16">
              <div className="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-24 w-24 mx-auto text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                Error Loading Vehicles
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                {error.message}
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  const vehicles = vehiclesData?.vehicles || [];

  return (
    <>
      {/* Header */}
      <div className="bg-white">
        <div className="py-4 md:py-10">
          {/* Title */}
          <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal mb-[11px]">
            My Vehicles
          </h1>
          {/* Sub-text */}
          <p className={cn(TYPOGRAPHY.pageDescription, "max-w-3xl mb-[11px]")}>
            View and manage your vehicle listings
          </p>
          {/* Add Vehicle Button */}
          <div className="mb-[11px]">
            <Button asChild size="sm">
              <Link href="/user/vehicles/new">
                Add Vehicle
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="">
          {/* Status Filter Tabs */}
          <div className="mb-8">
            <VehicleStatusTabs
              activeStatus={(filters.status ?? 'ALL_ACTIVE') as VehicleStatus | 'ALL_ACTIVE'}
              onStatusChange={(status) => updateFilters({ status })}
              counts={counts}
            />
          </div>

          {/* Vehicle Grid */}
          <UserVehicleGrid vehicles={vehicles} />
        </div>
      </main>
    </>
  );
}

/**
 * User Vehicles List Page
 * 
 * Main page for users to view their vehicles.
 * Requires authentication but not admin role.
 * Uses URL-based filter management for better UX and shareable URLs.
 */
export default function UserVehiclesPage() {
  return (
    <Suspense fallback={
      <>
        <div className="bg-white">
          <div className="">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-50"></div>
            </div>
          </div>
        </div>
      </>
    }>
      <UserVehiclesPageContent />
    </Suspense>
  );
}

