"use client";

/**
 * VehicleImageUploadZone Component
 * 
 * Reusable upload zone for vehicle images with:
 * - Drag-and-drop support
 * - Auto-upload on file selection
 * - Progress tracking for multiple files
 * - Error handling
 */

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { Upload, X, Check } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";
import { uploadImageWithProgress } from "~/lib/supabase/upload";
import type { UploadProgressState, VehicleImageUploadZoneProps } from "./types";

/**
 * Upload Progress Item Component
 */
function UploadProgressItem({ upload }: { upload: UploadProgressState }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium truncate">
            {upload.file.name}
          </span>
          {upload.uploaded && <Check className="h-4 w-4 text-green-600 flex-shrink-0" />}
          {upload.error && <X className="h-4 w-4 text-red-600 flex-shrink-0" />}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {upload.uploaded ? "Complete" : `${upload.progress}%`}
        </span>
      </div>
      {upload.uploading && <Progress value={upload.progress} />}
      {upload.error && (
        <p className="text-xs text-red-600">{upload.error}</p>
      )}
    </div>
  );
}

/**
 * Main Upload Zone Component
 */
export function VehicleImageUploadZone({
  vehicleId,
  onUploadComplete,
  disabled = false,
}: VehicleImageUploadZoneProps) {
  const [uploads, setUploads] = useState<UploadProgressState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();

  const createMediaMutation = api.media.createMedia.useMutation({
    onError: (error) => {
      toast.error(`Failed to create media record: ${error.message}`);
    },
  });

  // Handle upload
  const handleUpload = useCallback(async (uploadsToProcess: UploadProgressState[]) => {
    if (uploadsToProcess.length === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < uploadsToProcess.length; i++) {
      const upload = uploadsToProcess[i]!;

      // Mark as uploading
      setUploads((prev) =>
        prev.map((u, idx) =>
          idx === i ? { ...u, uploading: true } : u
        )
      );

      try {
        // Upload to Supabase
        const result = await uploadImageWithProgress(
          upload.file,
          vehicleId,
          (_, __, percentage) => {
            setUploads((prev) =>
              prev.map((u, idx) =>
                idx === i ? { ...u, progress: percentage } : u
              )
            );
          }
        );

        if (!result.success) {
          throw new Error(result.error ?? "Upload failed");
        }

        // Create media record in database
        await createMediaMutation.mutateAsync({
          vehicleId,
          filename: result.filename,
          publishedUrl: result.publicUrl!,
          fileSize: BigInt(result.fileSize),
          mimeType: upload.file.type,
          width: result.width,
          height: result.height,
          format: upload.file.type.split("/")[1],
        });

        // Mark as uploaded
        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === i
              ? { ...u, uploading: false, uploaded: true, progress: 100 }
              : u
          )
        );
        
        successCount++;
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        
        // Mark as error
        setUploads((prev) =>
          prev.map((u, idx) =>
            idx === i
              ? {
                  ...u,
                  uploading: false,
                  error: errorMessage,
                }
              : u
          )
        );
        
        // Show individual error toast
        toast.error(`Failed to upload ${upload.file.name}: ${errorMessage}`);
      }
    }
    
    // Show appropriate success/error message
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Uploaded ${successCount} image${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''}`);
    }
    
    // Invalidate queries to refresh data
    if (successCount > 0) {
      await utils.vehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.userVehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.media.invalidate(undefined, { refetchType: 'active' });
      
      // Call completion callback
      onUploadComplete?.(successCount);
    }

    // Clear uploads after a delay
    setTimeout(() => {
      setUploads([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 2000);
  }, [vehicleId, createMediaMutation, utils, onUploadComplete]);

  // Handle file selection - auto-upload
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const newUploads: UploadProgressState[] = fileArray.map((file) => ({
      file,
      progress: 0,
      uploading: false,
      uploaded: false,
    }));

    setUploads(newUploads);
    
    // Auto-upload after files are selected
    setTimeout(() => {
      void handleUpload(newUploads);
    }, 100);
  }, [handleUpload]);

  // Handle drag over for upload zone
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // Handle drop for upload zone
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect, disabled]
  );

  const hasUploads = uploads.length > 0;

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 md:p-8 text-center transition-colors ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:border-primary cursor-pointer'
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium mb-1">
          Drag and drop images here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP up to 15MB • Min 800×600px • Upload starts automatically
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          className="hidden"
        />
      </div>

      {/* Upload Progress */}
      {hasUploads && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {uploads.map((upload, index) => (
            <UploadProgressItem key={index} upload={upload} />
          ))}
        </div>
      )}
    </div>
  );
}

