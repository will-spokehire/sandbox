"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { MapPin, Tag } from "lucide-react";

interface PublicVehicleBasicInfoProps {
  vehicle: {
    name: string;
    year: string;
    engineCapacity: number | null;
    numberOfSeats: number | null;
    gearbox: string | null;
    exteriorColour: string | null;
    interiorColour: string | null;
    condition: string | null;
    isRoadLegal: boolean;
    make: {
      name: string;
    };
    model: {
      name: string;
    };
    steering: {
      id: string;
      name: string;
    } | null;
    owner: {
      city: string | null;
      county: string | null;
      country: {
        id: string;
        name: string;
      } | null;
    };
    collections?: Array<{
      id: string;
      collection: {
        id: string;
        name: string;
        color: string | null;
      };
    }>;
  };
}

/**
 * Public Vehicle Basic Information Card
 * 
 * Displays core vehicle details for public viewing.
 * NO price information displayed.
 * NO registration number displayed.
 * NO edit actions.
 * Includes location and collections/tags within the card.
 */
export function PublicVehicleBasicInfo({ vehicle }: PublicVehicleBasicInfoProps) {
  // Build location string
  const locationParts: string[] = [];
  if (vehicle.owner.city) locationParts.push(vehicle.owner.city);
  if (vehicle.owner.county) locationParts.push(vehicle.owner.county);
  if (vehicle.owner.country) locationParts.push(vehicle.owner.country.name);
  const hasLocation = locationParts.length > 0;

  const hasCollections = (vehicle.collections?.length ?? 0) > 0;

  const details = [
    {
      label: "Make & Model",
      value: `${vehicle.make.name} ${vehicle.model.name}`,
      highlight: true,
    },
    {
      label: "Year",
      value: vehicle.year,
    },
    {
      label: "Engine Capacity",
      value: vehicle.engineCapacity ? `${vehicle.engineCapacity}cc` : "N/A",
    },
    {
      label: "Number of Seats",
      value: vehicle.numberOfSeats ? String(vehicle.numberOfSeats) : "N/A",
    },
    {
      label: "Steering",
      value: vehicle.steering?.name ?? "N/A",
    },
    {
      label: "Gearbox",
      value: vehicle.gearbox ?? "N/A",
    },
    {
      label: "Exterior Colour",
      value: vehicle.exteriorColour ?? "N/A",
    },
    {
      label: "Interior Colour",
      value: vehicle.interiorColour ?? "N/A",
    },
    {
      label: "Condition",
      value: vehicle.condition ?? "N/A",
    },
    {
      label: "Road Legal",
      value: vehicle.isRoadLegal ? "Yes" : "No",
      badge: true,
      badgeVariant: vehicle.isRoadLegal ? "default" : "secondary",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Details Grid */}
        <dl className="grid gap-3 text-sm">
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between items-center gap-2">
              <dt className="text-muted-foreground flex items-center gap-1.5">
                {detail.icon}
                {detail.label}
              </dt>
              <dd
                className={detail.highlight ? "font-semibold text-right" : "text-right"}
              >
                {detail.badge ? (
                  <Badge variant={detail.badgeVariant as any}>{detail.value}</Badge>
                ) : (
                  detail.value
                )}
              </dd>
            </div>
          ))}
        </dl>

        {/* Location */}
        {hasLocation && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                Location
              </div>
              <div className="text-sm text-muted-foreground">
                {locationParts.join(", ")}
              </div>
            </div>
          </>
        )}

        {/* Collections & Tags */}
        {hasCollections && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Tag className="h-4 w-4 text-muted-foreground" />
                Collections & Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {vehicle.collections!.map(({ collection }) => (
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
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

