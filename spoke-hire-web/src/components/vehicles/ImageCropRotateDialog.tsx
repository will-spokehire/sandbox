"use client";

/**
 * ImageCropRotateDialog Component
 * 
 * Modal dialog for cropping and rotating vehicle images using react-easy-crop.
 * Features:
 * - Fixed 4:3 aspect ratio for consistent vehicle image display
 * - Touch-friendly zoom and pan controls
 * - Rotation in 90° increments
 * - Non-destructive editing (preserves original)
 */

import { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { toast } from "sonner";
import { RotateCw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import { createCroppedImage, getImageDimensions } from "~/lib/image-processing/crop-rotate";
import { uploadEditedImage } from "~/lib/supabase/upload";
import { api } from "~/trpc/react";
import type { ImageCropRotateDialogProps } from "./types";

const ASPECT_RATIO = 4 / 3; // Fixed aspect ratio for vehicle images

/**
 * Main ImageCropRotateDialog Component
 */
export function ImageCropRotateDialog({
  open,
  onOpenChange,
  image,
  vehicleId,
  onSuccess,
}: ImageCropRotateDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const utils = api.useUtils();

  // Mutation for updating the image in the database
  const updateImageMutation = api.media.updateEditedImage.useMutation({
    onSuccess: async () => {
      toast.success("Image updated successfully");
      // Invalidate queries to refresh the image grid
      await utils.vehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.userVehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.media.invalidate(undefined, { refetchType: 'active' });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update image: ${error.message}`);
      setIsProcessing(false);
    },
  });

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    }
  }, [open]);

  // Handle crop complete callback from react-easy-crop
  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Handle rotation button click (90° clockwise)
  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  // Handle zoom change
  const handleZoomChange = useCallback((value: number[]) => {
    setZoom(value[0] ?? 1);
  }, []);

  // Handle save - process and upload the edited image
  const handleSave = useCallback(async () => {
    if (!croppedAreaPixels) {
      toast.error("Please adjust the crop area");
      return;
    }

    setIsProcessing(true);

    try {
      // Create the cropped and rotated image
      const croppedBlob = await createCroppedImage(
        image.url,
        croppedAreaPixels,
        rotation
      );

      // Get dimensions of the processed image
      const dimensions = await getImageDimensions(croppedBlob);

      // Upload the edited image to Supabase
      const uploadResult = await uploadEditedImage(
        croppedBlob,
        vehicleId,
        `image-${image.id}`
      );

      if (!uploadResult.success) {
        throw new Error(uploadResult.error ?? "Upload failed");
      }

      // Update the database record with the new image URL
      await updateImageMutation.mutateAsync({
        imageId: image.id,
        vehicleId,
        filename: uploadResult.filename,
        publishedUrl: uploadResult.publicUrl!,
        fileSize: BigInt(uploadResult.fileSize),
        width: dimensions.width,
        height: dimensions.height,
      });

    } catch (error) {
      toast.error(
        `Failed to save edited image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, rotation, image, vehicleId, updateImageMutation]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
        <div className="px-4 pt-4 md:px-6 md:pt-6">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              Crop and rotate your image. The aspect ratio is fixed at 4:3 for consistency.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Crop Area */}
        <div className="relative flex-1 min-h-[400px] md:min-h-[500px] bg-black">
          <Cropper
            image={image.url}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={ASPECT_RATIO}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            objectFit="contain"
            showGrid={true}
            classes={{
              containerClassName: "cropper-container",
              cropAreaClassName: "crop-area",
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-4 md:px-6 border-t bg-background space-y-4">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomOut className="h-4 w-4" />
                Zoom
                <ZoomIn className="h-4 w-4" />
              </label>
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
              disabled={isProcessing}
            />
          </div>

          {/* Rotation Control */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Rotation</label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              disabled={isProcessing}
              className="gap-2"
            >
              <RotateCw className="h-4 w-4" />
              Rotate 90°
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 md:px-6 border-t bg-background">
          <DialogFooter className="flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex-1 sm:flex-none gap-2"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isProcessing ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

