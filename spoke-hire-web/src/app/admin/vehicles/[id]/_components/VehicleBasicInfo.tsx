"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Pencil } from "lucide-react";
import { formatPrice, formatRegistration } from "~/lib/vehicles";
import { formatPricingRate } from "~/lib/pricing";
import { type VehicleDetail } from "~/types/vehicle";

interface VehicleBasicInfoProps {
  vehicle: VehicleDetail;
  onEditClick: () => void;
}

/**
 * Vehicle Basic Information Card
 * 
 * Displays core vehicle details in a clean, organized format
 */
export function VehicleBasicInfo({ vehicle, onEditClick }: VehicleBasicInfoProps) {
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
      label: "Price",
      value: formatPrice(vehicle.price),
      highlight: true,
    },
    {
      label: "Hourly Rate",
      value: formatPricingRate(
        vehicle.hourlyRate ? Number(vehicle.hourlyRate) : undefined
      ),
    },
    {
      label: "Daily Rate",
      value: formatPricingRate(
        vehicle.dailyRate ? Number(vehicle.dailyRate) : undefined
      ),
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
      label: "Road Legal",
      value: vehicle.isRoadLegal ? "Yes" : "No",
      badge: true,
      badgeVariant: vehicle.isRoadLegal ? "default" : "secondary",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>Vehicle Details</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onEditClick}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {details.map((detail, index) => (
            <div key={detail.label}>
              <div className="flex items-center justify-between py-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  {detail.label}
                </dt>
                <dd
                  className={`text-sm ${
                    detail.highlight
                      ? "font-semibold text-foreground"
                      : "text-foreground"
                  } ${detail.mono ? "font-mono" : ""}`}
                >
                  {detail.badge ? (
                    <Badge variant={detail.badgeVariant as "default" | "secondary" | "destructive" | "outline"}>
                      {detail.value}
                    </Badge>
                  ) : (
                    detail.value
                  )}
                </dd>
              </div>
              {index < details.length - 1 && <Separator />}
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

