'use client';

import { useState, useEffect } from 'react';
import { useRequireAdmin } from '~/providers/auth-provider';
import { api } from '~/trpc/react';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { UserVehicleCard } from '../_components/UserVehicleCard';
import { VehicleStatusTabs } from '../_components/VehicleStatusTabs';
import type { VehicleStatus } from '@prisma/client';

/**
 * Dashboard Test Page - DEV ONLY
 * 
 * Allows testing the dashboard with any user's ID.
 * Only accessible by admins for development/testing purposes.
 */
export default function DashboardTestPage() {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const [testUserId, setTestUserId] = useState('');
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'ALL'>('ALL');

  // Auto-fill with current user ID
  useEffect(() => {
    if (user?.id && !testUserId) {
      setTestUserId(user.id);
      setActiveUserId(user.id);
    }
  }, [user, testUserId]);

  // Fetch users with vehicles for selection
  const { data: usersWithVehicles } = api.userVehicle.getUsersWithVehicles.useQuery(
    undefined,
    {
      enabled: !isAuthLoading && !!user && user.userType === 'ADMIN',
    }
  );

  // Fetch vehicles for the test user
  const {
    data: vehiclesData,
    isLoading: isVehiclesLoading,
    refetch,
  } = api.userVehicle.myVehicles.useQuery(
    {
      limit: 50,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      testOwnerId: activeUserId ?? undefined, // Pass test owner ID
    },
    {
      enabled: !!activeUserId,
    }
  );

  // Fetch vehicle counts
  const { data: counts } = api.userVehicle.myVehicleCounts.useQuery(
    {
      testOwnerId: activeUserId ?? undefined,
    },
    {
      enabled: !!activeUserId,
    }
  );

  const handleLoadUser = () => {
    if (testUserId) {
      setActiveUserId(testUserId);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-50"></div>
      </div>
    );
  }

  const vehicles = vehiclesData?.vehicles || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        {/* Warning Banner */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <strong className="font-medium">Development Mode:</strong> This page is for testing only. You can view vehicles for any user.
              </p>
            </div>
          </div>
        </div>

        {/* Test User Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test User Dashboard</CardTitle>
            <CardDescription>
              Enter a user ID to view their vehicles. This is for development/testing purposes only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Selection */}
            {usersWithVehicles && usersWithVehicles.length > 0 && (
              <div>
                <Label>Quick Select User</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                  {usersWithVehicles.map((userWithVehicle) => (
                    <Button
                      key={userWithVehicle.id}
                      variant="outline"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => {
                        setTestUserId(userWithVehicle.id);
                        setActiveUserId(userWithVehicle.id);
                      }}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">
                          {userWithVehicle.firstName || userWithVehicle.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {userWithVehicle.email} • {userWithVehicle._count.vehicles} vehicles
                        </span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual User ID Input */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="userId">Or Enter User ID Manually</Label>
                <Input
                  id="userId"
                  placeholder="Enter user ID (e.g., clxxxxxxxxxxxxx)"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Current user: {user?.email} ({user?.id})
                </p>
              </div>
              <div className="flex items-end">
                <Button onClick={handleLoadUser} disabled={!testUserId}>
                  Load Vehicles
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dashboard Content */}
        {activeUserId && (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                Vehicles for User: {activeUserId}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Testing dashboard view
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

            {/* Loading State */}
            {isVehiclesLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-slate-50"></div>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-16">
                <div className="mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-24 w-24 mx-auto text-slate-300 dark:text-slate-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  No vehicles for this user
                </h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  This user doesn't have any vehicles with the selected status.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                  <UserVehicleCard 
                    key={vehicle.id} 
                    vehicle={vehicle}
                    href={`/user/vehicles/test/${vehicle.id}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

