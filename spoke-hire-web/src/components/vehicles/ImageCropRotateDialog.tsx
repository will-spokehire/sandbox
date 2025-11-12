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
const MIN_OUTPUT_WIDTH = 1920; // Desired minimum output width for quality
const MIN_OUTPUT_HEIGHT = MIN_OUTPUT_WIDTH / ASPECT_RATIO; // 1440px

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
  const [maxZoom, setMaxZoom] = useState(3);
  const [minZoom, setMinZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

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

  // Use original image for cropping to avoid quality degradation
  const sourceImageUrl = image.originalUrl ?? image.url;

  // Load image and calculate smart zoom limits
  useEffect(() => {
    if (!open) return;

    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      setImageDimensions({ width: imgWidth, height: imgHeight });

      // Calculate the minimum zoom needed to fill the crop area
      const widthRatio = MIN_OUTPUT_WIDTH / imgWidth;
      const heightRatio = MIN_OUTPUT_HEIGHT / imgHeight;
      const minZoomNeeded = Math.max(widthRatio, heightRatio, 1);

      // Calculate max zoom to prevent excessive pixelation
      // Allow zoom up to 2x of the desired output size, but not beyond 3x
      const maxQualityZoom = Math.min((imgWidth / MIN_OUTPUT_WIDTH) * 2, 3);
      const calculatedMaxZoom = Math.max(maxQualityZoom, minZoomNeeded, 1.5);

      setMinZoom(minZoomNeeded);
      setMaxZoom(calculatedMaxZoom);
      
      // Set initial zoom to minimum needed or 1, whichever is greater
      setZoom(minZoomNeeded);
    };
    
    img.onerror = () => {
      // Fallback to defaults if image fails to load
      setMinZoom(1);
      setMaxZoom(3);
      setZoom(1);
    };
    
    img.src = sourceImageUrl;
  }, [open, sourceImageUrl]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
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
      // Create the cropped and rotated image from original source
      const croppedBlob = await createCroppedImage(
        sourceImageUrl,
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
  }, [croppedAreaPixels, rotation, image, vehicleId, updateImageMutation, sourceImageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
        <div className="px-4 pt-4 md:px-6 md:pt-6">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              Crop and rotate your image. The aspect ratio is fixed at 4:3 for consistency.
              {imageDimensions && (
                <span className="block text-xs mt-1 text-muted-foreground">
                  Original: {imageDimensions.width}×{imageDimensions.height}px
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Crop Area */}
        <div className="relative flex-1 min-h-[400px] md:min-h-[500px] bg-black">
          <Cropper
            image={sourceImageUrl}
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
            minZoom={minZoom}
            maxZoom={maxZoom}
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
                {maxZoom < 3 && (
                  <span className="text-xs ml-1">(limited by image size)</span>
                )}
              </span>
            </div>
            <Slider
              value={[zoom]}
              onValueChange={handleZoomChange}
              min={minZoom}
              max={maxZoom}
              step={0.05}
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

