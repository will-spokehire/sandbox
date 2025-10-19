/**
 * Shared types for vehicle image components
 */

/**
 * Image item for internal state
 */
export interface VehicleImageItem {
  id: string;
  url: string;
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

