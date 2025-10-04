"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { type VehicleDetail } from "~/types/vehicle";

interface VehicleDetailHeaderProps {
  vehicle: VehicleDetail;
}

/**
 * Vehicle Detail Header
 * 
 * Header for the vehicle detail page with back navigation.
 * Uses browser back() which automatically preserves the list state via URL.
 */
export function VehicleDetailHeader({ vehicle }: VehicleDetailHeaderProps) {
  const router = useRouter();

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
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
  );
}
