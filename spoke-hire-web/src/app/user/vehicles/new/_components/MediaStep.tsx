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
import { ImageIcon, CheckCircle2, Send } from "lucide-react";
import { VehicleImageManager } from "~/components/vehicles/VehicleImageManager";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { trackEvent } from "~/lib/analytics";

interface MediaStepProps {
  vehicleId: string;
  onComplete: () => void;
}

/**
 * Media Step Component
 * 
 * Requires users to upload at least one vehicle photo before continuing.
 * This step occurs after the vehicle has been created in DRAFT status.
 * Shows success dialog after completion with option to submit for review.
 */
export function MediaStep({ vehicleId, onComplete }: MediaStepProps) {
  const router = useRouter();
  const [hasImages, setHasImages] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [hasTrackedFirstImage, setHasTrackedFirstImage] = useState(false);

  // Fetch vehicle images to check if any exist
  const { data: images } = api.media.getVehicleImages.useQuery(
    { vehicleId },
    { 
      enabled: !!vehicleId,
      refetchInterval: 2000, // Poll every 2 seconds to update after uploads
    }
  );

  // Submit for review mutation
  const submitForReviewMutation = api.userVehicle.submitForReview.useMutation({
    onSuccess: () => {
      // Track submit for review
      trackEvent('vehicle_submitted_for_review', {
        vehicleId,
        imageCount: images?.length ?? 0,
      });
      
      toast.success("Vehicle submitted for review", {
        description: "An admin will review your vehicle shortly",
      });
      router.push(`/user/vehicles/${vehicleId}`);
    },
    onError: (error) => {
      toast.error("Failed to submit for review", {
        description: error.message,
      });
      // Still redirect to vehicle page
      router.push(`/user/vehicles/${vehicleId}`);
    },
  });

  // Update hasImages when data changes and track first image upload
  useEffect(() => {
    const imageCount = images?.length ?? 0;
    const hadImages = hasImages;
    const nowHasImages = imageCount > 0;
    
    setHasImages(nowHasImages);
    
    // Track first image upload (transition from 0 to 1+ images)
    if (!hadImages && nowHasImages && !hasTrackedFirstImage) {
      trackEvent('vehicle_first_image_uploaded', {
        vehicleId,
      });
      setHasTrackedFirstImage(true);
    }
  }, [images, hasImages, vehicleId, hasTrackedFirstImage]);

  const handleContinue = () => {
    setShowSuccessDialog(true);
  };

  const handleViewVehicle = () => {
    setShowSuccessDialog(false);
    onComplete();
  };

  const handleSubmitForReview = () => {
    setShowSuccessDialog(false);
    submitForReviewMutation.mutate({ vehicleId });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="w-full flex flex-col gap-3 items-center text-center mb-6">
          <h2 className="text-[32px] md:text-[40px] font-normal leading-[0.95] uppercase text-black tracking-[-0.4px]">
            Add Photos
          </h2>
          <p className="text-[18px] md:text-[22px] font-normal leading-[1.3] text-black tracking-[-0.22px]">
            Upload images of your vehicle
          </p>
        </div>

        {/* Show alert if no images */}
        {!hasImages && (
          <Alert variant="destructive" className="flex flex-col items-center text-center justify-center">
            <ImageIcon className="h-5 w-5 mb-2" />
            <AlertDescription className="text-sm md:text-base font-medium">
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
              Your vehicle has been added to your collection. You can now view it, or submit it for admin review to get it published.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleViewVehicle}
              disabled={submitForReviewMutation.isPending}
              className="w-full sm:w-auto"
            >
              View Vehicle
            </Button>
            <Button 
              onClick={handleSubmitForReview}
              disabled={submitForReviewMutation.isPending}
              className="w-full sm:w-auto gap-2"
            >
              <Send className="h-4 w-4" />
              {submitForReviewMutation.isPending ? "Submitting..." : "Submit for Review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

