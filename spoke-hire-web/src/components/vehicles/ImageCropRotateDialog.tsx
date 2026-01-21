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

      // For react-easy-crop, zoom controls how much of the image is cropped
      // Lower zoom = crop area shows more of the image = larger visible crop box
      // Higher zoom = crop area shows less of the image = smaller visible crop box
      
      // For smaller images (< target size), we want a LOWER initial zoom
      // so the crop area is larger and more visible/usable
      const isSmallImage = imgWidth < MIN_OUTPUT_WIDTH || imgHeight < MIN_OUTPUT_HEIGHT;
      
      // Calculate minimum zoom
      // For small images, use 1 (shows entire image in crop)
      // For large images, calculate based on desired output
      let minZoomNeeded;
      if (isSmallImage) {
        minZoomNeeded = 1;
      } else {
        const widthRatio = MIN_OUTPUT_WIDTH / imgWidth;
        const heightRatio = MIN_OUTPUT_HEIGHT / imgHeight;
        minZoomNeeded = Math.max(widthRatio, heightRatio, 1);
      }

      // Calculate max zoom
      // Small images: allow up to 3x zoom for fine control
      // Large images: limit to prevent excessive pixelation
      const calculatedMaxZoom = isSmallImage ? 3 : Math.min((imgWidth / MIN_OUTPUT_WIDTH) * 2, 3);
      
      // Ensure there's always a usable range (at least 0.5 difference)
      const finalMaxZoom = Math.max(calculatedMaxZoom, minZoomNeeded + 0.5);

      setMinZoom(minZoomNeeded);
      setMaxZoom(finalMaxZoom);
      
      // Set initial zoom based on whether there's saved state
      if (!image.editMetadata) {
        // For small images, start at min zoom (1) so crop area is large and visible
        // For large images, start at calculated minimum
        setZoom(minZoomNeeded);
      } else {
        // Restore saved zoom, but clamp to valid range
        const clampedZoom = Math.max(minZoomNeeded, Math.min(image.editMetadata.zoom, finalMaxZoom));
        setZoom(clampedZoom);
      }
    };
    
    img.onerror = () => {
      // Fallback to defaults if image fails to load
      setMinZoom(1);
      setMaxZoom(3);
      if (!image.editMetadata) {
        setZoom(1);
      } else {
        const clampedZoom = Math.max(1, Math.min(image.editMetadata.zoom, 3));
        setZoom(clampedZoom);
      }
    };
    
    img.src = sourceImageUrl;
  }, [open, sourceImageUrl, image.editMetadata]);

  // Load saved edit state when dialog opens
  useEffect(() => {
    if (open) {
      // Load saved edit state if available, otherwise use defaults
      if (image.editMetadata) {
        setCrop(image.editMetadata.crop);
        setRotation(image.editMetadata.rotation);
        if (image.editMetadata.croppedAreaPixels) {
          setCroppedAreaPixels(image.editMetadata.croppedAreaPixels);
        }
      } else {
        // Reset to defaults only if no saved state
        setCrop({ x: 0, y: 0 });
        setRotation(0);
        setCroppedAreaPixels(null);
        // Note: zoom is set by the image loading effect
      }
    }
  }, [open, image.editMetadata]);

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

      // Update the database record with the new image URL and edit metadata
      await updateImageMutation.mutateAsync({
        imageId: image.id,
        vehicleId,
        filename: uploadResult.filename,
        publishedUrl: uploadResult.publicUrl!,
        fileSize: BigInt(uploadResult.fileSize),
        width: dimensions.width,
        height: dimensions.height,
        editMetadata: {
          crop,
          zoom,
          rotation,
          croppedAreaPixels,
        },
      });

    } catch (error) {
      toast.error(
        `Failed to save edited image: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, rotation, crop, zoom, image, vehicleId, updateImageMutation, sourceImageUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0">
        <div className="px-4 pt-4 md:px-6 md:pt-6">
          <DialogHeader>
            <DialogTitle>Edit Image</DialogTitle>
            <DialogDescription>
              Crop and rotate your image. The aspect ratio is fixed at 4:3 for consistency.
              {imageDimensions && (
                <span className="block body-xs mt-1 text-muted-foreground">
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
            restrictPosition={true}
            classes={{
              containerClassName: "cropper-container",
              cropAreaClassName: "crop-area",
            }}
          />
        </div>

        {/* Controls */}
        <div className="px-4 py-4 md:px-6 border-t bg-background space-y-5">
          {/* Zoom Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-2">
                <ZoomOut className="h-4 w-4 md:h-4 md:w-4" />
                Zoom
                <ZoomIn className="h-4 w-4 md:h-4 md:w-4" />
              </label>
              <span className="text-sm text-muted-foreground">
                {Math.round(zoom * 100)}%
                {imageDimensions && (imageDimensions.width < MIN_OUTPUT_WIDTH || imageDimensions.height < MIN_OUTPUT_HEIGHT) && (
                  <span className="body-xs ml-1 hidden sm:inline">(small image)</span>
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
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium">Rotation</label>
            <Button
              variant="outline"
              size="default"
              onClick={handleRotate}
              disabled={isProcessing}
              className="gap-2 min-h-[44px] px-4 sm:size-sm sm:min-h-0"
            >
              <RotateCw className="h-4 w-4" />
              Rotate 90°
            </Button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 md:px-6 border-t bg-background">
          <DialogFooter className="flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1 sm:flex-none min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isProcessing || !croppedAreaPixels}
              className="flex-1 sm:flex-none gap-2 min-h-[44px]"
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

