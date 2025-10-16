"use client";

/**
 * Image Edit Dialog Component
 * 
 * Allows users to manage vehicle images:
 * - Drag-and-drop reordering (auto-saved)
 * - Delete images (immediate)
 * - Upload new images (auto-upload with progress tracking)
 * - Automatic primary image assignment (first image)
 * 
 * All actions are saved automatically - no manual save required.
 */

import { useState, useCallback, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Upload, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";
import { api } from "~/trpc/react";
import { uploadImageWithProgress } from "~/lib/supabase/upload";
import { cn } from "~/lib/utils";

/**
 * Image item for internal state
 */
interface ImageItem {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

/**
 * Upload progress state for a single file
 */
interface UploadProgressState {
  file: File;
  progress: number;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

interface ImageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  images: ImageItem[];
  onSuccess?: () => void;
}

/**
 * Sortable Image Card Component
 */
function SortableImageCard({
  image,
  onDelete,
}: {
  image: ImageItem;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted",
        isDragging && "z-50 opacity-50"
      )}
    >
      {/* Image */}
      <Image
        src={image.url}
        alt={`Vehicle image ${image.order}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 33vw"
      />

      {/* Primary Badge */}
      {image.isPrimary && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="default" className="bg-primary text-primary-foreground">
            Primary
          </Badge>
        </div>
      )}

      {/* Drag Handle - Always visible on mobile, hover on desktop */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 cursor-move rounded bg-background/80 p-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Delete Button - Always visible on mobile, hover on desktop */}
      <button
        onClick={() => onDelete(image.id)}
        className="absolute bottom-2 right-2 z-10 rounded bg-destructive p-2 text-destructive-foreground opacity-100 transition-opacity hover:bg-destructive/90 md:opacity-0 md:group-hover:opacity-100"
        aria-label="Delete image"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Order Badge */}
      <div className="absolute bottom-2 left-2 z-10 rounded bg-background/80 px-2 py-1 text-xs font-medium">
        {image.order}
      </div>
    </div>
  );
}

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
 * Main Image Edit Dialog Component
 */
export function ImageEditDialog({
  open,
  onOpenChange,
  vehicleId,
  images: initialImages,
  onSuccess,
}: ImageEditDialogProps) {
  const [images, setImages] = useState<ImageItem[]>(initialImages);
  const [uploads, setUploads] = useState<UploadProgressState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // tRPC queries and mutations
  const utils = api.useUtils();
  
  // Query to fetch vehicle images
  const { refetch: refetchImages } = api.media.getVehicleImages.useQuery(
    { vehicleId },
    { enabled: false } // Don't auto-fetch, only on demand
  );
  
  const reorderMutation = api.media.reorderImages.useMutation({
    onSuccess: async () => {
      // Silent success - auto-save shouldn't be noisy
      // Invalidate and refetch active queries immediately
      await utils.vehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.userVehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.media.invalidate(undefined, { refetchType: 'active' });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to reorder images: ${error.message}`);
    },
  });

  const deleteMutation = api.media.deleteImage.useMutation({
    onSuccess: async () => {
      toast.success("Image deleted successfully");
      // Invalidate and refetch active queries immediately
      await utils.vehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.userVehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.media.invalidate(undefined, { refetchType: 'active' });
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(`Failed to delete image: ${error.message}`);
    },
  });

  const createMediaMutation = api.media.createMedia.useMutation({
    onError: (error) => {
      toast.error(`Failed to create media record: ${error.message}`);
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reset state when dialog opens/closes
  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setImages(initialImages);
        setUploads([]);
        setIsUploading(false);
      } else {
        setImages(initialImages);
      }
      onOpenChange(newOpen);
    },
    [initialImages, onOpenChange]
  );

  // Handle drag end - auto-save order
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update order values and primary flag
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index + 1,
          isPrimary: index === 0,
        }));

        // Auto-save the new order to backend
        reorderMutation.mutate({
          vehicleId,
          imageUpdates: updatedItems.map((img) => ({
            id: img.id,
            order: img.order,
            isPrimary: img.isPrimary,
          })),
        });

        return updatedItems;
      });
    }
  }, [vehicleId, reorderMutation]);

  // Handle delete
  const handleDelete = useCallback(
    (imageId: string) => {
      if (
        !confirm(
          "Are you sure you want to delete this image? This action cannot be undone."
        )
      ) {
        return;
      }

      deleteMutation.mutate(
        { imageId, vehicleId },
        {
          onSuccess: () => {
            // Optimistically remove from local state
            setImages((prev) => {
              const filtered = prev.filter((img) => img.id !== imageId);
              // Recalculate order and primary
              return filtered.map((img, index) => ({
                ...img,
                order: index + 1,
                isPrimary: index === 0,
              }));
            });
          },
        }
      );
    },
    [deleteMutation, vehicleId]
  );

  // Handle upload
  const handleUpload = useCallback(async (uploadsToProcess?: UploadProgressState[]) => {
    const currentUploads = uploadsToProcess ?? uploads;
    if (currentUploads.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < currentUploads.length; i++) {
      const upload = currentUploads[i]!;

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

    setIsUploading(false);
    
    // Show appropriate success/error message
    if (successCount > 0 && errorCount === 0) {
      toast.success(`Successfully uploaded ${successCount} image${successCount > 1 ? 's' : ''}`);
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`Uploaded ${successCount} image${successCount > 1 ? 's' : ''}, ${errorCount} failed`);
    } else if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} image${errorCount > 1 ? 's' : ''}`);
    }
    
    // Refetch images to update the dialog with newly uploaded images
    if (successCount > 0) {
      const result = await refetchImages();
      if (result.data) {
        // Update local images state with fetched data
        setImages(result.data.map((media) => ({
          id: media.id,
          url: media.publishedUrl ?? media.originalUrl,
          order: media.order,
          isPrimary: media.isPrimary,
        })));
      }
      
      // Invalidate and refetch active queries to refresh other parts of the app
      await utils.vehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.userVehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.media.invalidate(undefined, { refetchType: 'active' });
      
      // Call onSuccess callback
      onSuccess?.();
    }

    // Clear uploads after a delay
    setTimeout(() => {
      setUploads([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }, 2000);
  }, [uploads, vehicleId, createMediaMutation, utils, onSuccess, refetchImages]);

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
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const isBusy = deleteMutation.isPending || isUploading;
  const hasUploads = uploads.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col gap-0 p-0">
        <div className="px-4 pt-4 md:px-6 md:pt-6">
          <DialogHeader>
            <DialogTitle>Edit Vehicle Images</DialogTitle>
            <DialogDescription>
              Drag to reorder images (saved automatically). The first image will be set as primary.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
          <div className="space-y-6">
          {/* Image Grid */}
          {images.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Current Images</h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                    {images.map((image) => (
                      <SortableImageCard
                        key={image.id}
                        image={image}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Upload Zone */}
          <div>
            <h3 className="text-sm font-medium mb-3">Upload New Images</h3>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed rounded-lg p-6 md:p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium mb-1">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                JPEG, PNG, WebP up to 15MB • Upload starts automatically
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Upload Progress */}
            {hasUploads && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {uploads.map((upload, index) => (
                  <UploadProgressItem key={index} upload={upload} />
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="px-4 py-4 md:px-6 md:py-6 border-t bg-background">
          <DialogFooter className="mt-0">
            <Button
              onClick={() => handleOpenChange(false)}
              disabled={isBusy}
            >
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

