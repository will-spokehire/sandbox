"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { api } from "~/trpc/react";
import type { VehicleDetail } from "~/types/vehicle";

interface EditVehicleCollectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VehicleDetail;
  onSuccess?: () => void;
  /** If true, uses admin endpoint */
  isAdmin?: boolean;
}

interface CollectionOption {
  id: string;
  name: string;
  color?: string | null;
}

/**
 * Dialog for editing vehicle collections/tags
 * 
 * Works for both admin and owner users
 * Admin uses vehicle.update mutation
 * Owner uses userVehicle.updateMyVehicle mutation
 */
export function EditVehicleCollectionsDialog({
  open,
  onOpenChange,
  vehicle,
  onSuccess,
  isAdmin = false,
}: EditVehicleCollectionsDialogProps) {
  const utils = api.useUtils();
  
  // Get current collection IDs
  const initialCollectionIds = useMemo(() => 
    vehicle.collections.map(vc => vc.collection.id),
    [vehicle.collections]
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(initialCollectionIds);

  // Fetch all available collections
  const { data: filterOptions, isLoading: isLoadingCollections } = 
    api.userVehicle.getFilterOptions.useQuery();

  const collectionOptions: CollectionOption[] = useMemo(() => {
    const collections = filterOptions?.collections as CollectionOption[] | undefined;
    return collections ?? [];
  }, [filterOptions?.collections]);

  // Admin mutation
  const adminUpdateMutation = api.vehicle.update.useMutation({
    onSuccess: async () => {
      toast.success("Collections updated successfully");
      
      // Invalidate caches
      await Promise.all([
        utils.vehicle.getById.invalidate({ id: vehicle.id }),
        utils.vehicle.list.invalidate(),
      ]);
      
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update collections: ${String(error.message)}`);
    },
  });

  // Owner mutation
  const ownerUpdateMutation = api.userVehicle.updateMyVehicle.useMutation({
    onSuccess: async () => {
      toast.success("Collections updated successfully");
      
      // Invalidate caches
      await Promise.all([
        utils.userVehicle.myVehicleById.invalidate({ id: vehicle.id }),
        utils.userVehicle.myVehicles.invalidate(),
      ]);
      
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update collections: ${String(error.message)}`);
    },
  });

  const isUpdating = adminUpdateMutation.isPending || ownerUpdateMutation.isPending;

  const handleSave = () => {
    if (isAdmin) {
      adminUpdateMutation.mutate({
        id: vehicle.id,
        collectionIds: selectedIds,
      });
    } else {
      ownerUpdateMutation.mutate({
        id: vehicle.id,
        collectionIds: selectedIds,
      });
    }
  };

  const toggleCollection = (collectionId: string) => {
    if (selectedIds.includes(collectionId)) {
      setSelectedIds(selectedIds.filter(id => id !== collectionId));
    } else {
      setSelectedIds([...selectedIds, collectionId]);
    }
  };

  const hasChanges = JSON.stringify([...selectedIds].sort()) !== JSON.stringify([...initialCollectionIds].sort());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Collections & Tags</DialogTitle>
          <DialogDescription>
            Select collections/tags for this vehicle (click to toggle)
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isLoadingCollections ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {collectionOptions.map((collection) => {
                const isSelected = selectedIds.includes(collection.id);
                return (
                  <button
                    key={collection.id}
                    type="button"
                    onClick={() => toggleCollection(collection.id)}
                    className={`
                      px-4 py-2 rounded-md border-2 transition-all
                      ${isSelected 
                        ? 'border-primary bg-primary text-primary-foreground shadow-sm' 
                        : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
                      }
                    `}
                    style={
                      isSelected && collection.color
                        ? {
                            backgroundColor: collection.color,
                            borderColor: collection.color,
                            color: '#ffffff',
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-2">
                      {collection.color && !isSelected && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: collection.color }}
                        />
                      )}
                      <span>{collection.name}</span>
                      {isSelected && (
                        <Check className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          
          {collectionOptions.length === 0 && !isLoadingCollections && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No collections available
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isUpdating}
          >
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

