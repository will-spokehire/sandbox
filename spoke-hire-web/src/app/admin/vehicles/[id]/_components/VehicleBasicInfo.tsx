import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import { formatPrice, formatRegistration } from "~/lib/vehicles";
import { type VehicleDetail } from "~/types/vehicle";

interface VehicleBasicInfoProps {
  vehicle: VehicleDetail;
}

/**
 * Vehicle Basic Information Card
 * 
 * Displays core vehicle details in a clean, organized format
 */
export function VehicleBasicInfo({ vehicle }: VehicleBasicInfoProps) {
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
      label: "Engine Capacity",
      value: vehicle.engineCapacity ? `${vehicle.engineCapacity.toLocaleString()} cc` : "N/A",
    },
    {
      label: "Number of Seats",
      value: vehicle.numberOfSeats ? String(vehicle.numberOfSeats) : "N/A",
    },
    {
      label: "Steering",
      value: vehicle.steering?.name || "N/A",
    },
    {
      label: "Gearbox",
      value: vehicle.gearbox || "N/A",
    },
    {
      label: "Exterior Color",
      value: vehicle.exteriorColour || "N/A",
    },
    {
      label: "Interior Color",
      value: vehicle.interiorColour || "N/A",
    },
    {
      label: "Condition",
      value: vehicle.condition || "N/A",
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
                  {detail.badge ? (
                    <Badge variant={detail.badgeVariant as any}>
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

        {/* Description Section */}
        {vehicle.description && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Description
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {vehicle.description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

