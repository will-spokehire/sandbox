"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { formatRegistration } from "~/lib/vehicles";

interface PublicVehicleBasicInfoProps {
  vehicle: {
    name: string;
    year: string;
    registration: string | null;
    engineCapacity: number | null;
    numberOfSeats: number | null;
    gearbox: string | null;
    exteriorColour: string | null;
    interiorColour: string | null;
    condition: string | null;
    isRoadLegal: boolean;
    description: string | null;
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
  };
}

/**
 * Public Vehicle Basic Information Card
 * 
 * Displays core vehicle details for public viewing.
 * NO price information displayed.
 * NO edit actions.
 */
export function PublicVehicleBasicInfo({ vehicle }: PublicVehicleBasicInfoProps) {
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
      label: "Registration",
      value: formatRegistration(vehicle.registration),
      mono: true,
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
            <div key={index} className="flex justify-between items-center">
              <dt className="text-muted-foreground">{detail.label}</dt>
              <dd
                className={detail.highlight ? "font-semibold" : detail.mono ? "font-mono" : ""}
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

        {/* Description */}
        {vehicle.description && (
          <>
            <Separator />
            <div className="space-y-2">
              <h3 className="font-semibold">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {vehicle.description}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

