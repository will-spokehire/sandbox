"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useRequireAdmin } from "~/providers/auth-provider";
import { UserVehicleMedia } from "../../[id]/_components/UserVehicleMedia";
import { UserVehicleDetails } from "../../[id]/_components/UserVehicleDetails";
import { VehicleCollections } from "~/app/admin/vehicles/[id]/_components/VehicleCollections";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
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
  
  // Fetch vehicle data - admin test mode with testOwnerId
  const { data: vehicleData, isLoading: isVehicleLoading, error } = api.userVehicle.myVehicleById.useQuery(
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
            <Button onClick={() => router.push("/user/vehicles/test")}>
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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/user/vehicles/test")}
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
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Two-Column Layout: Photos on Left (larger), Details on Right (smaller) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Media Gallery (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            <UserVehicleMedia vehicle={vehicle} />
          </div>

          {/* Right Column - Vehicle Details (1/3 width on desktop) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Vehicle Details */}
            <UserVehicleDetails vehicle={vehicle} />
            
            {/* Collections & Tags */}
            <VehicleCollections collections={vehicle.collections} />
          </div>
        </div>
      </main>
    </div>
  );
}

