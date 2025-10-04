import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/server";
import { Button } from "~/components/ui/button";
import {
  VehicleMediaSection,
  VehicleBasicInfo,
  VehicleOwnerInfo,
  VehicleCollections,
  VehicleMetadata,
} from "./_components";

/**
 * Vehicle Detail Page
 * 
 * Displays full details of a single vehicle for admin review
 */
export default async function VehicleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // Fetch vehicle data on the server
  let vehicle;
  
  try {
    vehicle = await api.vehicle.getById({ id: params.id });
  } catch (error) {
    notFound();
  }

  if (!vehicle) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2"
            >
              <Link href="/admin/vehicles">
                <ArrowLeft className="h-4 w-4" />
                Back to Vehicles
              </Link>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 truncate">
                {vehicle.name}
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {vehicle.make.name} {vehicle.model.name} • {vehicle.year}
              </p>
            </div>
          </div>
        </div>
      </header>

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

