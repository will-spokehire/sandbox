"use client";

/**
 * VehicleImageManager Component
 * 
 * Combines upload zone and image grid into a single component.
 * Manages state coordination and provides a complete image management solution.
 */

import { useState, useEffect, useCallback } from "react";
import { api } from "~/trpc/react";
import { VehicleImageUploadZone } from "./VehicleImageUploadZone";
import { VehicleImageGrid } from "./VehicleImageGrid";
import { cn } from "~/lib/utils";
import type { VehicleImageItem, VehicleImageManagerProps } from "./types";

/**
 * Main Manager Component
 */
export function VehicleImageManager({
  vehicleId,
  onSuccess,
  className,
}: VehicleImageManagerProps) {
  const [images, setImages] = useState<VehicleImageItem[]>([]);

  // Fetch vehicle images
  const { data: mediaData, refetch } = api.media.getVehicleImages.useQuery(
    { vehicleId },
    { enabled: !!vehicleId }
  );

  // Update local images state when data is fetched
  useEffect(() => {
    if (mediaData) {
      const mappedImages: VehicleImageItem[] = mediaData.map((media) => ({
        id: media.id,
        url: media.publishedUrl ?? media.originalUrl,
        originalUrl: media.originalUrl,
        order: media.order,
        isPrimary: media.isPrimary,
        editMetadata: media.editMetadata as any,
      }));
      setImages(mappedImages);
    }
  }, [mediaData]);

  // Handle upload completion
  const handleUploadComplete = useCallback(async (successCount: number) => {
    if (successCount > 0) {
      // Refetch images to update the grid
      await refetch();
      onSuccess?.();
    }
  }, [refetch, onSuccess]);

  // Handle images change from grid
  const handleImagesChange = useCallback((updatedImages: VehicleImageItem[]) => {
    setImages(updatedImages);
  }, []);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Image Grid - Shows current images */}
      <VehicleImageGrid
        vehicleId={vehicleId}
        images={images}
        onImagesChange={handleImagesChange}
      />

      {/* Upload Zone */}
      <div>
        <h3 className="text-sm font-medium mb-3">Upload New Images</h3>
        <VehicleImageUploadZone
          vehicleId={vehicleId}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    </div>
  );
}

