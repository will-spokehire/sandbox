import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { formatPrice, formatRegistration } from "~/lib/vehicles";
import { type VehicleDetail } from "~/types/vehicle";
import { VehicleStatusBadge } from "~/app/admin/vehicles/_components/VehicleStatusBadge";

interface UserVehicleDetailsProps {
  vehicle: VehicleDetail;
}

/**
 * User Vehicle Details Card
 * 
 * Simplified vehicle details for owners - no admin-specific fields
 * Shows key information owners care about
 */
export function UserVehicleDetails({ vehicle }: UserVehicleDetailsProps) {
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
      label: "Current Status",
      value: vehicle.status,
      statusBadge: true,
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
      label: "Exterior Color",
      value: vehicle.exteriorColour ?? "N/A",
    },
    {
      label: "Interior Color",
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
        <CardTitle className="flex items-center gap-2">
          <span>Vehicle Details</span>
        </CardTitle>
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
                  {detail.statusBadge ? (
                    <VehicleStatusBadge status={vehicle.status} />
                  ) : detail.badge ? (
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

