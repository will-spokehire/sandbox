"use client";

/**
 * VehicleImageGrid Component
 * 
 * Reusable grid for managing vehicle images with:
 * - Drag-and-drop reordering (auto-saved)
 * - Touch support for mobile (long-press to drag)
 * - Delete functionality with confirmation
 * - Edit functionality (crop/rotate)
 * - Primary badge on first image
 * - Order indicators
 */

import { useCallback, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
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
import { GripVertical, Trash2, Pencil } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
import { ImageCropRotateDialog } from "./ImageCropRotateDialog";
import type { VehicleImageItem, VehicleImageGridProps } from "./types";

/**
 * Sortable Image Card Component
 */
function SortableImageCard({
  image,
  onDelete,
  onEdit,
  disabled,
}: {
  image: VehicleImageItem;
  onDelete: (id: string) => void;
  onEdit: (image: VehicleImageItem) => void;
  disabled?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative aspect-[4/3] overflow-hidden rounded-lg border bg-muted touch-none",
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "z-50 opacity-50"
      )}
    >
      {/* Image */}
      <Image
        src={image.url}
        alt={`Vehicle image ${image.order}`}
        fill
        className="object-cover pointer-events-none"
        sizes="(max-width: 768px) 50vw, 33vw"
      />

      {/* Primary Badge */}
      {image.isPrimary && (
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <Badge variant="default" className="bg-primary text-primary-foreground">
            Primary
          </Badge>
        </div>
      )}

      {/* Drag Indicator - Visual hint that item is draggable */}
      {!disabled && (
        <div className="absolute top-2 right-2 z-20 pointer-events-none rounded bg-background/80 backdrop-blur-sm p-1.5 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Action Buttons - Edit and Delete - Always visible on mobile, hover on desktop */}
      {!disabled && (
        <div className="absolute bottom-2 right-2 z-20 flex gap-2">
          {/* Edit Button */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(image);
            }}
            className="rounded bg-primary p-2 text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl md:opacity-0 md:shadow-md md:group-hover:opacity-100"
            aria-label="Edit image"
          >
            <Pencil className="h-4 w-4" />
          </button>

          {/* Delete Button */}
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(image.id);
            }}
            className="rounded bg-destructive p-2 text-destructive-foreground shadow-lg transition-all hover:bg-destructive/90 hover:shadow-xl md:opacity-0 md:shadow-md md:group-hover:opacity-100"
            aria-label="Delete image"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Order Badge */}
      <div className="absolute bottom-2 left-2 z-10 rounded bg-background/80 px-2 py-1 text-xs font-medium pointer-events-none">
        {image.order}
      </div>
    </div>
  );
}

/**
 * Main Grid Component
 */
export function VehicleImageGrid({
  vehicleId,
  images,
  onImagesChange,
  disabled = false,
}: VehicleImageGridProps) {
  const utils = api.useUtils();
  const [editingImage, setEditingImage] = useState<VehicleImageItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const reorderMutation = api.media.reorderImages.useMutation({
    onSuccess: async () => {
      // Silent success - auto-save shouldn't be noisy
      // Invalidate and refetch active queries immediately
      await utils.vehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.userVehicle.invalidate(undefined, { refetchType: 'active' });
      await utils.media.invalidate(undefined, { refetchType: 'active' });
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
    },
    onError: (error) => {
      toast.error(`Failed to delete image: ${error.message}`);
    },
  });

  // Drag and drop sensors - optimized for both desktop and mobile
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      // Long press to activate drag on mobile (prevents conflict with scrolling)
      activationConstraint: {
        delay: 250,      // 250ms press before drag activates
        tolerance: 5,    // Allow 5px movement for scrolling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end - auto-save order
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((i) => i.id === active.id);
      const newIndex = images.findIndex((i) => i.id === over.id);

      const newItems = arrayMove(images, oldIndex, newIndex);

      // Update order values and primary flag
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index + 1,
        isPrimary: index === 0,
      }));

      // Update local state via callback
      onImagesChange?.(updatedItems);

      // Auto-save the new order to backend
      reorderMutation.mutate({
        vehicleId,
        imageUpdates: updatedItems.map((img) => ({
          id: img.id,
          order: img.order,
          isPrimary: img.isPrimary,
        })),
      });
    }
  }, [images, vehicleId, reorderMutation, onImagesChange]);

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
            const filtered = images.filter((img) => img.id !== imageId);
            // Recalculate order and primary
            const updatedImages = filtered.map((img, index) => ({
              ...img,
              order: index + 1,
              isPrimary: index === 0,
            }));
            onImagesChange?.(updatedImages);
          },
        }
      );
    },
    [deleteMutation, vehicleId, images, onImagesChange]
  );

  // Handle edit
  const handleEdit = useCallback((image: VehicleImageItem) => {
    setEditingImage(image);
    setIsEditDialogOpen(true);
  }, []);

  // Handle edit success - refresh images
  const handleEditSuccess = useCallback(() => {
    setIsEditDialogOpen(false);
    setEditingImage(null);
  }, []);

  if (images.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-sm font-medium mb-3">Current Images ({images.length})</h3>
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
                onEdit={handleEdit}
                disabled={disabled}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Edit Dialog */}
      {editingImage && (
        <ImageCropRotateDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          image={editingImage}
          vehicleId={vehicleId}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}

