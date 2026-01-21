import { Calendar, Database, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { type VehicleDetail } from "~/types/vehicle";

interface VehicleMetadataProps {
  vehicle: VehicleDetail;
}

/**
 * Vehicle Metadata Component
 * 
 * Displays timestamps, sources, and other metadata
 */
export function VehicleMetadata({ vehicle }: VehicleMetadataProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(date));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          <span>Metadata & History</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timestamps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <dt className="body-xs text-muted-foreground mb-1">Created</dt>
              <dd className="text-sm font-medium text-foreground">
                {formatDate(vehicle.createdAt)}
              </dd>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <dt className="body-xs text-muted-foreground mb-1">Last Updated</dt>
              <dd className="text-sm font-medium text-foreground">
                {formatDate(vehicle.updatedAt)}
              </dd>
            </div>
          </div>
        </div>

        {/* Data Sources */}
        {vehicle.sources && vehicle.sources.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-foreground">
                  Data Sources
                </h4>
              </div>
              <div className="space-y-2">
                {vehicle.sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {source.sourceType}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ID: {source.sourceId}
                      </span>
                    </div>
                    {source.matchScore !== null && (
                      <Badge variant="secondary">
                        Match: {source.matchScore}%
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Vehicle ID for reference */}
        <Separator />
        <div className="body-xs text-muted-foreground text-center">
          Vehicle ID: <span className="font-mono">{vehicle.id}</span>
        </div>
      </CardContent>
    </Card>
  );
}

