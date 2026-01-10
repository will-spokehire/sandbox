"use client";

import { use, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "~/trpc/react";
import { useRequireAuth } from "~/providers/auth-provider";
import { UserVehicleMedia } from "./_components/UserVehicleMedia";
import { UserVehicleDetails } from "./_components/UserVehicleDetails";
import { UserVehicleActions } from "./_components/UserVehicleActions";
import { VehicleCollections } from "~/app/admin/vehicles/[id]/_components/VehicleCollections";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import type { VehicleDetail } from "~/types/vehicle";
import { EditVehicleDialog } from "./_components/EditVehicleDialog";
import { formatPricingRate } from "~/lib/pricing";
import { cn } from "~/lib/utils";
import { TYPOGRAPHY } from "~/lib/design-tokens";
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
  const searchParams = useSearchParams();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Check if user came from registration flow
  const fromRegistration = searchParams.get("from") === "registration";
  
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

  // Get validation errors for DRAFT/DECLINED vehicles
  const { data: validationData } = api.userVehicle.getValidationErrors.useQuery(
    { vehicleId: id },
    { enabled: !!vehicle && (vehicle.status === "DRAFT" || vehicle.status === "DECLINED") }
  );

  const validationErrors = validationData?.errors ?? [];
  const hasValidationErrors = validationErrors.length > 0;

  const isLoading = isAuthLoading || isVehicleLoading;

  // Handle loading state with skeleton
  if (isLoading || !user) {
    return (
      <>
        {/* Header Skeleton */}
        <div className="bg-white">
          <div className="py-4 md:py-10">
            <div className="flex items-start gap-4">
              <Skeleton className="h-9 w-20 mt-1" />
              <div className="flex-1">
                <Skeleton className="h-12 md:h-20 w-full max-w-2xl mb-[11px]" />
                <Skeleton className="h-5 w-48" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <main className="flex-1 bg-white">
          <div className="py-4 md:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Left Column - Media Skeleton */}
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="aspect-[4/3] w-full rounded-md" />
                <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-md" />
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
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center py-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        {i < 9 && <Skeleton className="h-px w-full" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-6 w-20" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  // Handle error or unauthorized access
  if (error || !vehicle) {
    return (
      <>
        <div className="bg-white">
          <div className="py-4 md:py-10">
            <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal">
              Vehicle Not Found
            </h1>
          </div>
        </div>
        <main className="flex-1 bg-white">
          <div className="pt-4 md:pt-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vehicle Not Found</AlertTitle>
              <AlertDescription>
                The vehicle you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => router.push(fromRegistration ? "/user/vehicles/new" : "/user/vehicles")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {fromRegistration ? "Back to Registration" : "Back to My Vehicles"}
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white">
        <div className="py-4 md:py-10">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            {/* Left: Back button + Vehicle name */}
            <div className=" gap-4 min-w-0 flex-1">
              {/* Back button - alone at top on mobile */}
              <div className="w-full md:w-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(fromRegistration ? "/user/vehicles/new" : "/user/vehicles")}
                  className="px-0"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </div>
              {/* Title section - below back button on mobile */}
              <div className="min-w-0 flex-1">
                <h1 className={cn(TYPOGRAPHY.h1, "text-black mb-[11px]")}>
                  {vehicle.year} {vehicle.make.name} {vehicle.model.name}
                </h1>
                <p className={cn(TYPOGRAPHY.bodyLarge, "text-black")} >
                  {[
                    vehicle.hourlyRate && `£${vehicle.hourlyRate}/hr`,
                    vehicle.dailyRate && `£${vehicle.dailyRate}/day`
                  ].filter(Boolean).join(' • ') || 'Pricing not set'}
                </p>
              </div>
            </div>

            {/* Right: Action buttons */}
            <div className="flex items-center gap-2 sm:pt-2">
              <UserVehicleActions
                vehicleId={vehicle.id}
                currentStatus={vehicle.status}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className=" py-8">
          {/* Show draft message if vehicle hasn't been submitted yet */}
          {vehicle.status === "DRAFT" && (
            <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle className="text-amber-900 dark:text-amber-100">
                Draft Vehicle
              </AlertTitle>
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                This vehicle is currently in draft mode and hasn&apos;t been published yet. 
                Click the &quot;Publish&quot; button above to submit it for admin review.
              </AlertDescription>
            </Alert>
          )}

          {/* Show in-review message if vehicle is awaiting approval */}
          {vehicle.status === "IN_REVIEW" && (
            <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">
                Awaiting Review
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Your vehicle has been submitted and is awaiting admin approval. 
                You&apos;ll receive an email notification once it&apos;s been reviewed. 
                No further action is needed at this time.
              </AlertDescription>
            </Alert>
          )}

          {/* Show declined reason if vehicle is declined */}
          {vehicle.status === "DECLINED" && vehicle.declinedReason && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Vehicle Declined</AlertTitle>
              <AlertDescription>
                <p><span className="font-medium">Reason: </span>{vehicle.declinedReason}</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Show validation errors if can't submit for review */}
          {(vehicle.status === "DRAFT" || vehicle.status === "DECLINED") && hasValidationErrors && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Cannot submit for review</AlertTitle>
              <AlertDescription>
                <p className="mb-2">Please complete the following:</p>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Two-Column Layout: Photos on Left (larger), Details on Right (smaller) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Left Column - Media Gallery (2/3 width on desktop) */}
            <div className="lg:col-span-2 space-y-4">
              <UserVehicleMedia vehicle={vehicle} />
            </div>

            {/* Right Column - Vehicle Details (1/3 width on desktop) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Vehicle Details */}
              <UserVehicleDetails 
                vehicle={vehicle}
                onEditClick={() => setIsEditDialogOpen(true)}
              />
              
              {/* Collections & Tags - Shared component is fine (just displays tags) */}
              <VehicleCollections 
                collections={vehicle.collections}
                vehicle={vehicle}
                canEdit={true}
                isAdmin={false}
              />
            </div>
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

