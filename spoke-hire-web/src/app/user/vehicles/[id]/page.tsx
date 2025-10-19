"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useRequireAuth } from "~/providers/auth-provider";
import { UserVehicleMedia } from "./_components/UserVehicleMedia";
import { UserVehicleDetails } from "./_components/UserVehicleDetails";
import { VehicleCollections } from "~/app/admin/vehicles/[id]/_components/VehicleCollections";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { AlertCircle, ArrowLeft, Pencil } from "lucide-react";
import type { VehicleDetail } from "~/types/vehicle";
import { EditVehicleDialog } from "./_components/EditVehicleDialog";

/**
 * User Vehicle Detail Page
 * 
 * Displays full details of a vehicle for the owner.
 * Uses separate user-specific components (no admin features).
 * Protected route - requires authentication (user must be owner).
 */
export default function UserVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Unwrap params Promise as required by Next.js 15
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  // Fetch vehicle data - uses secure endpoint with ownership check
  const { data: vehicleData, isLoading: isVehicleLoading, error } = api.userVehicle.myVehicleById.useQuery(
    { id },
    {
      enabled: !!user,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  ) as { data: VehicleDetail | undefined; isLoading: boolean; error: Error | null };
  
  const vehicle: VehicleDetail | undefined = vehicleData;

  const isLoading = isAuthLoading || isVehicleLoading;

  // Handle loading state with skeleton
  if (isLoading || !user) {
    return (
      <>
        {/* Header Skeleton */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-9 w-20" />
              <div>
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <main className="container mx-auto px-4 py-6 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Media Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="overflow-hidden">
                <Skeleton className="aspect-[3/2] w-full" />
              </Card>
              <div className="grid grid-cols-6 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/2]" />
                ))}
              </div>
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>

            {/* Right Column - Details Skeleton */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Handle error or unauthorized access
  if (error || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Vehicle Not Found</AlertTitle>
          <AlertDescription>
            The vehicle you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/user/vehicles")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Vehicles
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/user/vehicles")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditDialogOpen(true)}
              className="gap-2"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Edit</span>
            </Button>
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
            
            {/* Collections & Tags - Shared component is fine (just displays tags) */}
            <VehicleCollections 
              collections={vehicle.collections}
              vehicle={vehicle}
              canEdit={true}
              isAdmin={false}
            />
          </div>
        </div>
      </main>

      {/* Edit Vehicle Dialog */}
      {isEditDialogOpen && (
        <EditVehicleDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          vehicle={vehicle}
          onSuccess={() => {
            // Dialog handles cache invalidation
          }}
        />
      )}
    </>
  );
}

