/**
 * Supabase Upload Utility
 * 
 * Handles resumable image uploads to Supabase Storage using TUS protocol
 * Includes client-side image resizing to reduce bandwidth and storage costs
 */

import * as tus from "tus-js-client";
import { createClient } from "./client";

const BUCKET_NAME = "vehicle-images";
const MAX_FILE_SIZE_MB = 15;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const RESIZE_THRESHOLD_MB = 3;
const RESIZE_THRESHOLD_BYTES = RESIZE_THRESHOLD_MB * 1024 * 1024;
const RESIZE_WIDTH = 1920;
const JPEG_QUALITY = 0.85;
const CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks (required by Supabase)
const RETRY_DELAYS = [0, 3000, 5000, 10000, 20000];

// Minimum image dimensions
const MIN_IMAGE_WIDTH = 800;
const MIN_IMAGE_HEIGHT = 600;

/**
 * Upload progress callback
 */
export interface UploadProgressCallback {
  (bytesUploaded: number, bytesTotal: number, percentage: number): void;
}

/**
 * Upload result
 */
export interface UploadResult {
  success: boolean;
  publicUrl: string | null;
  storagePath: string | null;
  filename: string;
  fileSize: number;
  width?: number;
  height?: number;
  error: string | null;
}

/**
 * Resize result from image processing
 */
interface ResizeResult {
  blob: Blob;
  wasResized: boolean;
  originalSize: number;
  newSize: number;
  width: number;
  height: number;
}

/**
 * Validate file before upload
 */
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size must be less than ${MAX_FILE_SIZE_MB}MB`,
    };
  }

  // Check file type
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: "Only JPEG, PNG, and WebP images are allowed",
    };
  }

  return { valid: true };
}

/**
 * Validate image dimensions
 */
function validateDimensions(
  width: number,
  height: number
): { valid: boolean; error?: string } {
  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    return {
      valid: false,
      error: `Image must be at least ${MIN_IMAGE_WIDTH}×${MIN_IMAGE_HEIGHT}px (current: ${width}×${height}px)`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize filename for storage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/~/g, "-")
    .replace(/[<>:"|?*]/g, "")
    .replace(/\s+/g, "_");
}

/**
 * Check if image has transparency (for PNG files)
 */
async function hasTransparency(file: File): Promise<boolean> {
  if (!file.type.includes("png")) {
    return false;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);

      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(false);
        return;
      }

      // Check alpha channel
      for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i]! < 255) {
          resolve(true);
          return;
        }
      }
      resolve(false);
    };

    img.onerror = () => resolve(false);
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Resize image if needed using Canvas API
 */
async function resizeImageIfNeeded(file: File): Promise<ResizeResult> {
  const originalSize = file.size;

  // If file is small enough, no resize needed
  if (originalSize <= RESIZE_THRESHOLD_BYTES) {
    return {
      blob: file,
      wasResized: false,
      originalSize,
      newSize: originalSize,
      width: 0, // Will be determined later
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Failed to get canvas context"));
      return;
    }

    img.onload = async () => {
      // Calculate new dimensions
      let { width, height } = img;

      if (width > RESIZE_WIDTH) {
        const ratio = RESIZE_WIDTH / width;
        width = RESIZE_WIDTH;
        height = Math.round(height * ratio);
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Determine output format
      const isPng = file.type === "image/png";
      let outputFormat = "image/jpeg";
      let quality = JPEG_QUALITY;

      // Keep PNG format if image has transparency
      if (isPng) {
        const transparent = await hasTransparency(file);
        if (transparent) {
          outputFormat = "image/png";
          quality = 0.9;
        }
      }

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Failed to create blob from canvas"));
            return;
          }

          resolve({
            blob,
            wasResized: true,
            originalSize,
            newSize: blob.size,
            width,
            height,
          });
        },
        outputFormat,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error("Failed to load image"));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get image dimensions
 */
async function getImageDimensions(
  file: File | Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error("Failed to load image for dimensions"));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload image to Supabase with progress tracking
 */
export async function uploadImageWithProgress(
  file: File,
  vehicleId: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file);
  if (!validation.valid) {
    return {
      success: false,
      publicUrl: null,
      storagePath: null,
      filename: file.name,
      fileSize: file.size,
      error: validation.error ?? "Invalid file",
    };
  }

  try {
    // Get original dimensions before processing
    const originalDimensions = await getImageDimensions(file);
    
    // Validate dimensions
    const dimensionValidation = validateDimensions(
      originalDimensions.width,
      originalDimensions.height
    );
    if (!dimensionValidation.valid) {
      return {
        success: false,
        publicUrl: null,
        storagePath: null,
        filename: file.name,
        fileSize: file.size,
        width: originalDimensions.width,
        height: originalDimensions.height,
        error: dimensionValidation.error ?? "Image dimensions too small",
      };
    }

    // Resize image if needed
    const resizeResult = await resizeImageIfNeeded(file);

    // Get dimensions if not available from resize
    let dimensions = { width: resizeResult.width, height: resizeResult.height };
    if (dimensions.width === 0) {
      dimensions = await getImageDimensions(resizeResult.blob);
    }

    // Sanitize filename and add timestamp to make it unique
    const sanitizedFilename = sanitizeFilename(file.name);
    const timestamp = Date.now();
    const fileExt = sanitizedFilename.substring(sanitizedFilename.lastIndexOf('.'));
    const fileNameWithoutExt = sanitizedFilename.substring(0, sanitizedFilename.lastIndexOf('.'));
    const uniqueFilename = `${fileNameWithoutExt}_${timestamp}${fileExt}`;
    const storagePath = `vehicles/${vehicleId}/${uniqueFilename}`;

    // Get Supabase session for auth token
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        publicUrl: null,
        storagePath: null,
        filename: file.name,
        fileSize: resizeResult.newSize,
        error: "Not authenticated",
      };
    }

    // Get Supabase URL and determine if we're in local development
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return {
        success: false,
        publicUrl: null,
        storagePath: null,
        filename: file.name,
        fileSize: resizeResult.newSize,
        error: "Invalid Supabase configuration - URL missing",
      };
    }

    // Determine the upload endpoint based on environment
    const isLocalDev = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
    let uploadEndpoint: string;

    if (isLocalDev) {
      // For local development, use the local Supabase storage endpoint
      uploadEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;
    } else {
      // For production, use the project-specific storage hostname
      const projectId = supabaseUrl.split("//")[1]?.split(".")[0];
      if (!projectId) {
        return {
          success: false,
          publicUrl: null,
          storagePath: null,
          filename: file.name,
          fileSize: resizeResult.newSize,
          error: "Invalid Supabase configuration - cannot extract project ID",
        };
      }
      uploadEndpoint = `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
    }

    // Upload using TUS protocol
    const uploadResult = await new Promise<{
      success: boolean;
      url?: string;
      error?: string;
    }>((resolve, reject) => {
      const upload = new tus.Upload(resizeResult.blob, {
        // Use the determined endpoint (local or production)
        endpoint: uploadEndpoint,
        retryDelays: RETRY_DELAYS,
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "x-upsert": "true", // Allow overwriting existing files
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: BUCKET_NAME,
          objectName: storagePath,
          contentType: resizeResult.blob.type,
          cacheControl: "3600",
        },
        chunkSize: CHUNK_SIZE,
        onError: (error) => {
          // Handle file already exists (409 Conflict)
          if (error.message?.includes("409") || error.message?.includes("Conflict")) {
            // Try to get the existing file's URL
            const { data: urlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(storagePath);
            
            if (urlData?.publicUrl) {
              // File exists, return success with existing URL
              resolve({
                success: true,
                url: urlData.publicUrl,
              });
              return;
            }
          }
          
          resolve({
            success: false,
            error: error.message,
          });
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Number(
            ((bytesUploaded / bytesTotal) * 100).toFixed(2)
          );
          onProgress?.(bytesUploaded, bytesTotal, percentage);
        },
        onSuccess: () => {
          resolve({
            success: true,
            url: upload.url ?? undefined,
          });
        },
      });

      // Check for previous uploads and resume if found
      upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0]!);
          }
          upload.start();
        })
        .catch((error) => {
          reject(error);
        });
    });

    if (!uploadResult.success) {
      return {
        success: false,
        publicUrl: null,
        storagePath: null,
        filename: file.name,
        fileSize: resizeResult.newSize,
        error: uploadResult.error ?? "Upload failed",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      success: true,
      publicUrl: urlData.publicUrl ?? null,
      storagePath,
      filename: file.name,
      fileSize: resizeResult.newSize,
      width: dimensions.width,
      height: dimensions.height,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      publicUrl: null,
      storagePath: null,
      filename: file.name,
      fileSize: file.size,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Upload multiple images with progress tracking
 */
export async function uploadMultipleImages(
  files: File[],
  vehicleId: string,
  onFileProgress?: (
    fileIndex: number,
    bytesUploaded: number,
    bytesTotal: number,
    percentage: number
  ) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i]!;
    const result = await uploadImageWithProgress(file, vehicleId, (uploaded, total, pct) => {
      onFileProgress?.(i, uploaded, total, pct);
    });
    results.push(result);
  }

  return results;
}

/**
 * Upload an edited image (Blob) to Supabase Storage
 * Used after cropping/rotating an existing image
 * 
 * @param blob - The processed image blob
 * @param vehicleId - Vehicle ID for storage path
 * @param originalFilename - Base filename (without extension)
 * @param onProgress - Optional progress callback
 * @returns Upload result with new URL
 */
export async function uploadEditedImage(
  blob: Blob,
  vehicleId: string,
  originalFilename: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    // Get dimensions from the blob
    const dimensions = await getImageDimensions(blob);

    // Generate unique filename with timestamp for cache busting
    const timestamp = Date.now();
    const uniqueFilename = `${originalFilename}_v${timestamp}.jpg`;
    const storagePath = `vehicles/${vehicleId}/${uniqueFilename}`;

    // Get Supabase session for auth token
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        publicUrl: null,
        storagePath: null,
        filename: uniqueFilename,
        fileSize: blob.size,
        error: "Not authenticated",
      };
    }

    // Get Supabase URL and determine if we're in local development
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      return {
        success: false,
        publicUrl: null,
        storagePath: null,
        filename: uniqueFilename,
        fileSize: blob.size,
        error: "Invalid Supabase configuration - URL missing",
      };
    }

    // Determine the upload endpoint based on environment
    const isLocalDev = supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost');
    let uploadEndpoint: string;

    if (isLocalDev) {
      uploadEndpoint = `${supabaseUrl}/storage/v1/upload/resumable`;
    } else {
      const projectId = supabaseUrl.split("//")[1]?.split(".")[0];
      if (!projectId) {
        return {
          success: false,
          publicUrl: null,
          storagePath: null,
          filename: uniqueFilename,
          fileSize: blob.size,
          error: "Invalid Supabase configuration - cannot extract project ID",
        };
      }
      uploadEndpoint = `https://${projectId}.storage.supabase.co/storage/v1/upload/resumable`;
    }

    // Upload using TUS protocol
    const uploadResult = await new Promise<{
      success: boolean;
      url?: string;
      error?: string;
    }>((resolve, reject) => {
      const upload = new tus.Upload(blob, {
        endpoint: uploadEndpoint,
        retryDelays: RETRY_DELAYS,
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "x-upsert": "true",
        },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: {
          bucketName: BUCKET_NAME,
          objectName: storagePath,
          contentType: "image/jpeg",
          cacheControl: "3600",
        },
        chunkSize: CHUNK_SIZE,
        onError: (error) => {
          // Handle file already exists (409 Conflict)
          if (error.message?.includes("409") || error.message?.includes("Conflict")) {
            const { data: urlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(storagePath);
            
            if (urlData?.publicUrl) {
              resolve({
                success: true,
                url: urlData.publicUrl,
              });
              return;
            }
          }
          
          resolve({
            success: false,
            error: error.message,
          });
        },
        onProgress: (bytesUploaded, bytesTotal) => {
          const percentage = Number(
            ((bytesUploaded / bytesTotal) * 100).toFixed(2)
          );
          onProgress?.(bytesUploaded, bytesTotal, percentage);
        },
        onSuccess: () => {
          resolve({
            success: true,
            url: upload.url ?? undefined,
          });
        },
      });

      // Check for previous uploads and resume if found
      upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(previousUploads[0]!);
          }
          upload.start();
        })
        .catch((error) => {
          reject(error);
        });
    });

    if (!uploadResult.success) {
      return {
        success: false,
        publicUrl: null,
        storagePath: null,
        filename: uniqueFilename,
        fileSize: blob.size,
        error: uploadResult.error ?? "Upload failed",
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    return {
      success: true,
      publicUrl: urlData.publicUrl ?? null,
      storagePath,
      filename: uniqueFilename,
      fileSize: blob.size,
      width: dimensions.width,
      height: dimensions.height,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      publicUrl: null,
      storagePath: null,
      filename: originalFilename,
      fileSize: blob.size,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

