'use client';

import { useState } from 'react';
import { useRequireAuth } from '~/providers/auth-provider';
import { api } from '~/trpc/react';
import { DashboardHeader } from './_components/DashboardHeader';
import { VehicleStatusTabs } from './_components/VehicleStatusTabs';
import { UserVehicleGrid } from './_components/UserVehicleGrid';
import type { VehicleStatus } from '@prisma/client';

/**
 * User Vehicles List Page
 * 
 * Main page for users to view their vehicles.
 * Requires authentication but not admin role.
 */
export default function UserVehiclesPage() {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');

  // Fetch user's vehicles
  const {
    data: vehiclesData,
    isLoading: isVehiclesLoading,
    error,
  } = api.userVehicle.myVehicles.useQuery(
    {
      limit: 50,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
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

  // Show loading state
  if (isAuthLoading || isVehiclesLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-50"></div>
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
            activeStatus={statusFilter}
            onStatusChange={setStatusFilter}
            counts={counts}
          />
        </div>

        {/* Vehicle Grid */}
        <UserVehicleGrid vehicles={vehicles} />
      </main>
    </div>
  );
}

