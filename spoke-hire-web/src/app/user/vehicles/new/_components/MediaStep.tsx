"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ImageIcon, CheckCircle2 } from "lucide-react";
import { VehicleImageManager } from "~/components/vehicles/VehicleImageManager";
import { api } from "~/trpc/react";

interface MediaStepProps {
  vehicleId: string;
  onComplete: () => void;
}

/**
 * Media Step Component
 * 
 * Requires users to upload at least one vehicle photo before continuing.
 * This step occurs after the vehicle has been created in DRAFT status.
 * Shows success dialog after completion and redirects to vehicle detail page.
 */
export function MediaStep({ vehicleId, onComplete }: MediaStepProps) {
  const router = useRouter();
  const [hasImages, setHasImages] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Fetch vehicle images to check if any exist
  const { data: images } = api.media.getVehicleImages.useQuery(
    { vehicleId },
    { 
      enabled: !!vehicleId,
      refetchInterval: 2000, // Poll every 2 seconds to update after uploads
    }
  );

  // Update hasImages when data changes
  useEffect(() => {
    setHasImages((images?.length ?? 0) > 0);
  }, [images]);

  const handleContinue = () => {
    setShowSuccessDialog(true);
  };

  const handleViewVehicle = () => {
    setShowSuccessDialog(false);
    onComplete();
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Add Photos</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Upload at least one photo of your vehicle to continue
          </p>
        </div>

        {/* Show alert if no images */}
        {!hasImages && (
          <Alert>
            <ImageIcon className="h-4 w-4" />
            <AlertDescription className="text-sm">
              At least one photo is required. Good photos help your vehicle stand out and attract more opportunities.
            </AlertDescription>
          </Alert>
        )}

        {/* Inline Image Manager */}
        <VehicleImageManager vehicleId={vehicleId} />

        <div className="flex justify-end pt-6 border-t">
          <Button 
            onClick={handleContinue}
            disabled={!hasImages}
            size="default"
            className="w-full sm:w-auto"
          >
            {hasImages ? "Continue" : "Upload at least one photo to continue"}
          </Button>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-xl md:text-2xl">Vehicle Created Successfully!</DialogTitle>
            </div>
            <DialogDescription className="text-sm md:text-base">
              Your vehicle has been added to your collection. You can now view and manage it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push("/user/vehicles")}
              className="w-full sm:w-auto"
            >
              Back to Vehicles
            </Button>
            <Button 
              onClick={handleViewVehicle}
              className="w-full sm:w-auto"
            >
              View Vehicle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

