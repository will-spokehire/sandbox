"use client";

/**
 * Image Edit Dialog Component
 * 
 * Refactored to use the VehicleImageManager component.
 * Provides a dialog wrapper for backward compatibility with existing usage.
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { VehicleImageManager } from "./VehicleImageManager";

/**
 * Legacy image item interface for backward compatibility
 */
interface ImageItem {
  id: string;
  url: string;
  order: number;
  isPrimary: boolean;
}

interface ImageEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  images: ImageItem[];
  onSuccess?: () => void;
}

/**
 * Main Image Edit Dialog Component
 */
export function ImageEditDialog({
  open,
  onOpenChange,
  vehicleId,
  images: _initialImages,
  onSuccess,
}: ImageEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl min-h-[500px] max-h-[90vh] flex flex-col gap-0 p-0">
        <div className="px-4 pt-4 md:px-6 md:pt-6">
          <DialogHeader>
            <DialogTitle>Edit Vehicle Images</DialogTitle>
            <DialogDescription>
              Upload, reorder, and delete vehicle images.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
          <VehicleImageManager
            vehicleId={vehicleId}
            onSuccess={onSuccess}
          />
        </div>

        <div className="px-4 py-4 md:px-6 md:py-6 border-t bg-background">
          <DialogFooter className="mt-0">
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}


