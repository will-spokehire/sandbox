/**
 * Media-related types for the Media domain
 */

/**
 * Input for reordering vehicle images
 */
export interface ReorderImagesInput {
  vehicleId: string;
  imageUpdates: Array<{
    id: string;
    order: number;
  }>;
}

/**
 * Input for deleting a vehicle image
 */
export interface DeleteImageInput {
  imageId: string;
  vehicleId: string;
}

/**
 * Input for creating a new media record after upload
 */
export interface CreateMediaInput {
  vehicleId: string;
  filename: string;
  publishedUrl: string;
  fileSize?: bigint;
  mimeType?: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Client-side media item representation
 */
export interface MediaItem {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

/**
 * Upload progress callback data
 */
export interface UploadProgress {
  bytesUploaded: number;
  bytesTotal: number;
  percentage: number;
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  publicUrl: string | null;
  storagePath: string | null;
  error: string | null;
}

