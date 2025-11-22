"use client";

import { PublicVehicleCard } from "./PublicVehicleCard";
import { Skeleton } from "~/components/ui/skeleton";
import { Card, CardContent } from "~/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Button } from "~/components/ui/button";

interface PublicVehicleGridProps {
  vehicles: Array<{
    id: string;
    name: string;
    year: string;
    make: {
      name: string;
    };
    model: {
      name: string;
    };
    media: Array<{
      publishedUrl: string | null;
      originalUrl: string;
    }>;
    collections?: Array<{
      id: string;
      name: string;
    }>;
    owner: {
      city: string | null;
      county: string | null;
      country: {
        name: string;
      } | null;
    };
  }>;
  isLoading?: boolean;
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

/**
 * Public Vehicle Grid
 * 
 * Responsive grid layout for displaying vehicles in the public catalogue.
 * Shows 1 column on mobile, 2 on tablet, 3 on desktop, 4 on wide screens.
 */
export function PublicVehicleGrid({
  vehicles,
  isLoading = false,
  hasFilters = false,
  onClearFilters,
}: PublicVehicleGridProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (vehicles.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4">
              <AlertCircle className="h-8 w-8 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">No vehicles found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {hasFilters
                  ? "No vehicles match your search criteria. Try adjusting your filters."
                  : "There are no vehicles available at the moment. Please check back later."}
              </p>
            </div>
            {hasFilters && onClearFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid of vehicles
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vehicles.map((vehicle) => (
        <PublicVehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

