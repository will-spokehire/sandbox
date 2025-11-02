"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tag } from "lucide-react";
import { Badge } from "~/components/ui/badge";

interface VehicleCollectionsDisplayProps {
  collections: Array<{
    id: string;
    collection: {
      id: string;
      name: string;
      color: string | null;
    };
  }>;
}

/**
 * Vehicle Collections Display (Shared Component)
 * 
 * Displays collections/tags associated with the vehicle.
 * Read-only version for public viewing (no edit capability).
 */
export function VehicleCollectionsDisplay({ collections }: VehicleCollectionsDisplayProps) {
  const hasCollections = collections.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          <span>Collections & Tags</span>
        </CardTitle>
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
  );
}

