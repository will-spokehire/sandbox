import { notFound } from "next/navigation";
import { api } from "~/trpc/server";
import {
  VehicleMediaSection,
  VehicleBasicInfo,
  VehicleOwnerInfo,
  VehicleCollections,
  VehicleMetadata,
  VehicleDetailHeader,
} from "./_components";

/**
 * Vehicle Detail Page
 * 
 * Displays full details of a single vehicle for admin review.
 * Uses client-side back navigation to preserve list state.
 */
export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params as required by Next.js 15
  const { id } = await params;
  
  // Fetch vehicle data on the server
  let vehicle;
  
  try {
    vehicle = await api.vehicle.getById({ id });
  } catch (error) {
    notFound();
  }

  if (!vehicle) {
    notFound();
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
