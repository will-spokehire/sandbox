import { VehicleDetailBreadcrumbs } from "./VehicleDetailBreadcrumbs";
import { TYPOGRAPHY, VEHICLE_DETAIL, LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

interface VehicleDetailHeaderProps {
  vehicle: {
    name: string;
    year: string;
    make: {
      name: string;
    };
    model: {
      name: string;
    };
    owner: {
      city: string | null;
      county: string | null;
      country: {
        name: string;
      } | null;
    };
  };
}

/**
 * Vehicle Detail Header
 * 
 * Custom header component for vehicle detail pages matching Figma design.
 * Includes breadcrumbs, title, and location subtitle.
 */
export function VehicleDetailHeader({ vehicle }: VehicleDetailHeaderProps) {
  // Build location string
  const locationParts: string[] = [];
  if (vehicle.owner.city) locationParts.push(vehicle.owner.city);
  if (vehicle.owner.county) locationParts.push(vehicle.owner.county);
  if (vehicle.owner.country) locationParts.push(vehicle.owner.country.name);
  const location = locationParts.join(", ");

  // Build title: Year Make Model
  const titleParts = [vehicle.year, vehicle.make.name, vehicle.model.name];

  return (
    <div className="bg-white flex flex-col">
      <VehicleDetailBreadcrumbs vehicle={vehicle} />
      
      <div className={cn(
        VEHICLE_DETAIL.headerPadding,
        "pt-5 md:pt-[41px]",
        "pb-5 md:pb-[21px]" // Match Figma: 21px bottom padding for header-to-content gap
      )}>
        <div className={cn("flex flex-col", VEHICLE_DETAIL.titleLocationGap)}>
          {/* Title - flex-wrap with gap for word spacing */}
          <h1 className={cn(
            TYPOGRAPHY.h2,
            "flex flex-wrap gap-[0px_10px] md:gap-[2px_20px]"
          )}>
            {titleParts.map((part, index) => (
              <span key={index}>{part}</span>
            ))}
          </h1>
          
          {/* Location subtitle */}
          {location && (
            <p className={cn(TYPOGRAPHY.bodyLarge, "text-black")}>
              {location}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

