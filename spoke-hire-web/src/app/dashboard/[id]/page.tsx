"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useRequireAuth } from "~/providers/auth-provider";
import { VehicleMediaSection } from "~/app/admin/vehicles/[id]/_components/VehicleMediaSection";
import { VehicleBasicInfo } from "~/app/admin/vehicles/[id]/_components/VehicleBasicInfo";
import { VehicleCollections } from "~/app/admin/vehicles/[id]/_components/VehicleCollections";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { VehicleStatusBadge } from "~/app/admin/vehicles/_components/VehicleStatusBadge";
import type { VehicleDetail } from "~/types/vehicle";

/**
 * User Vehicle Detail Page
 * 
 * Displays full details of a vehicle for the owner.
 * Protected route - requires authentication (user must be owner).
 */
export default function UserVehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: isAuthLoading } = useRequireAuth();
  const router = useRouter();
  
  // Unwrap params Promise as required by Next.js 15
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  // Fetch vehicle data
  const { data: vehicleData, isLoading: isVehicleLoading, error } = api.vehicle.getById.useQuery(
    { id },
    {
      enabled: !!user,
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  ) as { data: VehicleDetail | undefined; isLoading: boolean; error: Error | null };
  
  const vehicle: VehicleDetail | undefined = vehicleData;

  const isLoading = isAuthLoading || isVehicleLoading;

  // Check if user owns this vehicle
  const isOwner = vehicle && user && vehicle.ownerId === user.id;

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

  // Handle error or unauthorized access
  if (error || !vehicle || !isOwner) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Vehicle Not Found</AlertTitle>
            <AlertDescription>
              The vehicle you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Vehicles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
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
            <VehicleStatusBadge status={vehicle.status} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Two-Column Layout: Photos on Left, Details on Right (Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column - Media Gallery (stacked on mobile, fixed on desktop) */}
          <div className="space-y-4">
            <VehicleMediaSection vehicle={vehicle} />
          </div>

          {/* Right Column - Vehicle Details */}
          <div className="space-y-6">
            {/* Vehicle Details */}
            <VehicleBasicInfo vehicle={vehicle} />
            
            {/* Collections & Tags */}
            <VehicleCollections collections={vehicle.collections} />
            
            {/* Listing Status */}
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
          </div>
        </div>
      </main>
    </div>
  );
}

