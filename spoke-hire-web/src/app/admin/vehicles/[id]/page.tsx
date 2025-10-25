"use client";

import { use, useState } from "react";
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
import type { VehicleDetail } from "~/types/vehicle";
import { SendDealToVehiclesDialog } from "~/components/deals";
import { EditVehicleDialog } from "./_components/EditVehicleDialog";

/**
 * Vehicle Detail Page
 * 
 * Displays full details of a single vehicle for admin review.
 * Uses client-side back navigation to preserve list state.
 * Protected route - requires admin authentication.
 * 
 * OPTIMIZATION: Implements TanStack Query caching for SPA-like performance.
 * When navigating from the list page, cached data is shown instantly.
 */
export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, isLoading: isAuthLoading } = useRequireAdmin();
  const router = useRouter();
  
  // Unwrap params Promise as required by Next.js 15
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  
  // Send Deal Dialog state
  const [isSendDealDialogOpen, setIsSendDealDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // Fetch vehicle data on the client
  // OPTIMIZATION: Uses TanStack Query cache with staleTime for SPA-like behavior
  // - If data was recently fetched, shows cached data instantly (no loading spinner)
  // - Refetches in background if data is older than staleTime
  // - Provides seamless navigation from list → detail page
  const { data: vehicleData, isLoading: isVehicleLoading, error } = api.vehicle.getById.useQuery(
    { id },
    {
      enabled: !!user, // Only fetch when user is authenticated
      retry: false,
      staleTime: 5 * 60 * 1000, // 5 minutes - reuse cached data if fresh
      // This makes navigation feel instant when coming from list page
      // Backend also has Prisma Accelerate caching (60s) for additional performance
    }
  ) as { data: VehicleDetail | undefined; isLoading: boolean; error: Error | null };
  
  const vehicle: VehicleDetail | undefined = vehicleData;

  const isLoading = isAuthLoading || isVehicleLoading;
  
  // Handle Send Deal
  const handleSendDeal = () => {
    setIsSendDealDialogOpen(true);
  };
  
  const handleDealSuccess = () => {
    setIsSendDealDialogOpen(false);
  };

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
              The vehicle you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view it.
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
      <VehicleDetailHeader 
        vehicle={vehicle} 
        onEdit={() => setIsEditDialogOpen(true)}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-8">
        {/* Two-Column Layout: Photos on Left (larger), Details on Right (smaller) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Media Gallery + Owner Info (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <VehicleMediaSection vehicle={vehicle} onSendDeal={handleSendDeal} />
            <VehicleOwnerInfo owner={vehicle.owner} vehicleId={vehicle.id} />
          </div>

          {/* Right Column - Vehicle Details, Collections, Metadata (1/3 width on desktop) */}
          <div className="lg:col-span-1 space-y-6">
            <VehicleBasicInfo 
              vehicle={vehicle}
              onEditClick={() => setIsEditDialogOpen(true)}
            />
            <VehicleCollections 
              collections={vehicle.collections} 
              vehicle={vehicle}
              canEdit={true}
              isAdmin={true}
            />
            <VehicleMetadata vehicle={vehicle} />
          </div>
        </div>
      </main>
      
      {/* Send Deal Dialog */}
      {isSendDealDialogOpen && (
        <SendDealToVehiclesDialog
          open={isSendDealDialogOpen}
          onOpenChange={setIsSendDealDialogOpen}
          selectedVehicleIds={[vehicle.id]}
          onSuccess={handleDealSuccess}
        />
      )}

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
    </div>
  );
}
