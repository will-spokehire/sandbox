/**
 * Shared types for vehicle image components
 */

import type { Area } from "react-easy-crop";

/**
 * Image item for internal state
 */
export interface VehicleImageItem {
  id: string;
  url: string;
  originalUrl?: string;
  order: number;
  isPrimary: boolean;
}

/**
 * Upload progress state for a single file
 */
export interface UploadProgressState {
  file: File;
  progress: number;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

/**
 * Props for VehicleImageUploadZone component
 */
export interface VehicleImageUploadZoneProps {
  vehicleId: string;
  onUploadComplete?: (successCount: number) => void;
  disabled?: boolean;
}

/**
 * Props for VehicleImageGrid component
 */
export interface VehicleImageGridProps {
  vehicleId: string;
  images: VehicleImageItem[];
  onImagesChange?: (images: VehicleImageItem[]) => void;
  disabled?: boolean;
}

/**
 * Props for VehicleImageManager component
 */
export interface VehicleImageManagerProps {
  vehicleId: string;
  onSuccess?: () => void;
  className?: string;
}

/**
 * Props for ImageCropRotateDialog component
 */
export interface ImageCropRotateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  image: VehicleImageItem;
  vehicleId: string;
  onSuccess?: () => void;
}

/**
 * Result from image editing operation
 */
export interface EditedImageResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Crop area export (re-export from react-easy-crop for convenience)
 */
export type { Area as CropArea };

