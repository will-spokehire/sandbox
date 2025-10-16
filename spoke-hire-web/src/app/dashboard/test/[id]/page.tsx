"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useRequireAdmin } from "~/providers/auth-provider";
import { VehicleMediaSection } from "~/app/admin/vehicles/[id]/_components/VehicleMediaSection";
import { VehicleBasicInfo } from "~/app/admin/vehicles/[id]/_components/VehicleBasicInfo";
import { VehicleCollections } from "~/app/admin/vehicles/[id]/_components/VehicleCollections";
import { VehicleMetadata } from "~/app/admin/vehicles/[id]/_components/VehicleMetadata";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { VehicleStatusBadge } from "~/app/admin/vehicles/_components/VehicleStatusBadge";
import type { VehicleDetail } from "~/types/vehicle";

/**
 * Test Vehicle Detail Page - DEV ONLY
 * 
 * Allows admins to preview how a vehicle detail page looks for users.
 * This is for development/testing purposes only.
 */
export default function TestVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  
  // Unwrap params Promise as required by Next.js 15
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  // Fetch vehicle data
  const { data: vehicleData, isLoading: isVehicleLoading, error } = api.vehicle.getById.useQuery(
    { id },
    {
      enabled: !!user && user.userType === 'ADMIN',
      retry: false,
      staleTime: 5 * 60 * 1000,
    }
  ) as { data: VehicleDetail | undefined; isLoading: boolean; error: Error | null };
  
  const vehicle: VehicleDetail | undefined = vehicleData;

  const isLoading = isAuthLoading || isVehicleLoading;

  // Handle loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  // Handle error
  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Vehicle Not Found</AlertTitle>
            <AlertDescription>
              The vehicle you&apos;re looking for doesn&apos;t exist.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard/test")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Test Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Warning Banner */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-400">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700 dark:text-yellow-200">
                <strong className="font-medium">Test Mode:</strong> Viewing as owner ({vehicle.owner.email})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard/test")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Test
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {vehicle.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {vehicle.make.name} {vehicle.model.name} • {vehicle.year}
                </p>
              </div>
            </div>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Media Section */}
          <VehicleMediaSection vehicle={vehicle} />

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <VehicleBasicInfo vehicle={vehicle} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <VehicleCollections collections={vehicle.collections} />
              
              {/* Status Info Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Listing Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Status</span>
                    <VehicleStatusBadge status={vehicle.status} />
                  </div>
                  {vehicle.status === 'DRAFT' && (
                    <p className="text-sm text-muted-foreground">
                      Your vehicle is in draft status. Contact us to publish it.
                    </p>
                  )}
                  {vehicle.status === 'PUBLISHED' && (
                    <p className="text-sm text-muted-foreground">
                      Your vehicle is live and visible to production companies.
                    </p>
                  )}
                  {vehicle.status === 'DECLINED' && (
                    <p className="text-sm text-muted-foreground">
                      This listing needs review. Please contact us for more information.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Test Info Card */}
              <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
                <CardHeader>
                  <CardTitle className="text-yellow-900 dark:text-yellow-200">Test Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-yellow-700 dark:text-yellow-300">Vehicle ID:</span>
                    <span className="font-mono text-yellow-900 dark:text-yellow-100">{vehicle.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700 dark:text-yellow-300">Owner:</span>
                    <span className="font-medium text-yellow-900 dark:text-yellow-100">{vehicle.owner.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-700 dark:text-yellow-300">Owner ID:</span>
                    <span className="font-mono text-yellow-900 dark:text-yellow-100">{vehicle.ownerId}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Metadata Section */}
          <VehicleMetadata vehicle={vehicle} />
        </div>
      </main>
    </div>
  );
}

