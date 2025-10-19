"use client";

import { useState } from "react";
import { Tag, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { type VehicleDetail } from "~/types/vehicle";
import { EditVehicleCollectionsDialog } from "./EditVehicleCollectionsDialog";

interface VehicleCollectionsProps {
  collections: VehicleDetail["collections"];
  vehicle?: VehicleDetail;
  canEdit?: boolean;
  isAdmin?: boolean;
}

/**
 * Vehicle Collections Component
 * 
 * Displays collections/tags associated with the vehicle
 * Optionally shows edit button for admins and owners
 */
export function VehicleCollections({ collections, vehicle, canEdit = false, isAdmin = false }: VehicleCollectionsProps) {
  const hasCollections = collections.length > 0;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              <span>Collections & Tags</span>
            </CardTitle>
            {canEdit && vehicle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasCollections ? (
            <div className="flex flex-wrap gap-2">
              {collections.map(({ collection }) => (
                <Badge
                  key={collection.id}
                  variant="secondary"
                  className="text-sm px-3 py-1.5"
                  style={{
                    backgroundColor: collection.color
                      ? `${collection.color}20`
                      : undefined,
                    borderColor: collection.color ?? undefined,
                    color: collection.color ?? undefined,
                  }}
                >
                  {collection.name}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No collections assigned to this vehicle.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {canEdit && vehicle && isEditDialogOpen && (
        <EditVehicleCollectionsDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          vehicle={vehicle}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

