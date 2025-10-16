'use client';

import { Suspense } from 'react';
import { useRequireAuth } from '~/providers/auth-provider';
import { api } from '~/trpc/react';
import { useURLFilters } from '~/hooks/useURLFilters';
import { DashboardHeader } from './_components/DashboardHeader';
import { VehicleStatusTabs } from './_components/VehicleStatusTabs';
import { UserVehicleGrid } from './_components/UserVehicleGrid';
import { Skeleton } from '~/components/ui/skeleton';
import { Card, CardContent } from '~/components/ui/card';
import { z } from 'zod';
import type { VehicleStatus } from '@prisma/client';

// Filter schema for URL-based filter management
const userVehicleFiltersSchema = z.object({
  status: z.enum(['ALL', 'DRAFT', 'PUBLISHED', 'DECLINED', 'ARCHIVED']).default('ALL'),
});

type UserVehicleFilters = z.infer<typeof userVehicleFiltersSchema>;

const defaultFilters: UserVehicleFilters = {
  status: 'ALL',
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
      status: filters.status === 'ALL' ? undefined : (filters.status as VehicleStatus),
    },
    {
      enabled: !isAuthLoading && !!user,
    }
  );

  // Fetch vehicle counts
  const { data: counts } = api.userVehicle.myVehicleCounts.useQuery(
    {},
    {
      enabled: !isAuthLoading && !!user,
    }
  );

  // Show loading state with skeleton
  if (isAuthLoading || isVehiclesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          {/* Page Title Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Tabs Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-full max-w-md" />
          </div>

          {/* Vehicle Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[3/2] w-full" />
                <CardContent className="pt-3 p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-3" />
                  <Skeleton className="h-5 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
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
        </main>
      </div>
    );
  }

  const vehicles = vehiclesData?.vehicles || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            My Vehicles
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            View and manage your vehicle listings
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <VehicleStatusTabs
            activeStatus={(filters.status ?? 'ALL') as VehicleStatus | 'ALL'}
            onStatusChange={(status) => updateFilters({ status })}
            counts={counts}
          />
        </div>

        {/* Vehicle Grid */}
        <UserVehicleGrid vehicles={vehicles} />
      </main>
    </div>
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-50"></div>
          </div>
        </main>
      </div>
    }>
      <UserVehiclesPageContent />
    </Suspense>
  );
}

