"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useRequireAdmin } from "~/providers/auth-provider";
import { VehicleMediaSection } from "./_components/VehicleMediaSection";
import { VehicleBasicInfo } from "./_components/VehicleBasicInfo";
import { VehicleOwnerInfo } from "./_components/VehicleOwnerInfo";
import { VehicleCollections } from "./_components/VehicleCollections";
import { VehicleMetadata } from "./_components/VehicleMetadata";
import { VehicleDetailHeader } from "./_components/VehicleDetailHeader";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * Vehicle Detail Page
 * 
 * Displays full details of a single vehicle for admin review.
 * Uses client-side back navigation to preserve list state.
 * Protected route - requires admin authentication.
 */
export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  
  // Unwrap params Promise as required by Next.js 15
  const { id } = use(params);
  
  // Fetch vehicle data on the client
  const { data: vehicle, isLoading: isVehicleLoading, error } = api.vehicle.getById.useQuery(
    { id },
    {
      enabled: !!user, // Only fetch when user is authenticated
      retry: false,
    }
  );

  const isLoading = isAuthLoading || isVehicleLoading;

  // Handle loading state
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Vehicle Not Found</AlertTitle>
            <AlertDescription>
              The vehicle you're looking for doesn't exist or you don't have permission to view it.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push("/admin/vehicles")}>
              Back to Vehicles
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <VehicleDetailHeader vehicle={vehicle} />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        <div className="space-y-6">
          {/* Media Section - Hero Image + Gallery */}
          <VehicleMediaSection vehicle={vehicle} />

          {/* Two-Column Layout for Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              <VehicleBasicInfo vehicle={vehicle} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <VehicleOwnerInfo owner={vehicle.owner} vehicleId={vehicle.id} />
              <VehicleCollections collections={vehicle.collections} />
            </div>
          </div>

          {/* Metadata Section */}
          <VehicleMetadata vehicle={vehicle} />
        </div>
      </main>
    </div>
  );
}
