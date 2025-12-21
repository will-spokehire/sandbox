"use client";

import Link from "next/link";
import { TYPOGRAPHY, VEHICLE_DETAIL, SPACING_CLASSES } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

interface PublicVehicleBasicInfoProps {
  vehicle: {
    id: string;
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
 * Public Vehicle Basic Information
 * 
 * Displays core vehicle details for public viewing.
 * NO price information displayed.
 * NO registration number displayed.
 * NO edit actions.
 * Matches Figma design with no icons, simplified layout.
 */
export function PublicVehicleBasicInfo({ vehicle }: PublicVehicleBasicInfoProps) {
  const hasCollections = (vehicle.collections?.length ?? 0) > 0;

  const details = [
    {
      label: "Make & Model",
      value: `${vehicle.make.name} ${vehicle.model.name}`,
    },
    {
      label: "Year",
      value: vehicle.year,
    },
    {
      label: "Steering",
      value: vehicle.steering?.name ?? "N/A",
    },
    {
      label: "Engine Capacity",
      value: vehicle.engineCapacity ? `${vehicle.engineCapacity}cc` : "N/A",
    },
    {
      label: "Gearbox",
      value: vehicle.gearbox ?? "N/A",
    },
    {
      label: "Number of Seats",
      value: vehicle.numberOfSeats ? String(vehicle.numberOfSeats) : "N/A",
    },
    {
      label: "Exterior",
      value: vehicle.exteriorColour ?? "N/A",
    },
    {
      label: "Interior",
      value: vehicle.interiorColour ?? "N/A",
    },
    {
      label: "Condition",
      value: vehicle.condition ?? "N/A",
    },
    {
      label: "Road Legal",
      value: vehicle.isRoadLegal ? "yes" : "no",
    },
  ];

  return (
    <div className={cn("flex flex-col", SPACING_CLASSES.xl)}>
      {/* Make Enquiry Button */}
      <Link 
        href={`/enquiry/new?vehicleId=${vehicle.id}`}
        className="md:static fixed bottom-0 left-0 right-0 z-50 md:z-auto md:relative"
      >
        <div className={cn(
          "px-4 md:px-0 py-5 md:py-0 bg-white md:bg-transparent",
          "md:w-full"
        )}>
          <button className={cn(VEHICLE_DETAIL.makeEnquiryButton, "w-full", "border-0 md:border md:border-spoke-black")}>
            Make enquiry
          </button>
        </div>
      </Link>

      {/* Details Section */}
      <div className={cn("flex flex-col", VEHICLE_DETAIL.sectionGap)}>
        <h2 className={cn(TYPOGRAPHY.h3, "text-black")}>DETAILS</h2>
        <dl className={cn("flex flex-col", VEHICLE_DETAIL.detailRowGap)}>
          {details.map((detail, index) => (
            <div key={index} className="flex justify-between items-start leading-[1.4]">
              <dt className={cn(TYPOGRAPHY.bodyMedium, "uppercase text-black")}>
                {detail.label}
              </dt>
              <dd className={cn(
                TYPOGRAPHY.bodyLargeLight,
                "text-black uppercase"
              )}>
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Tags Section */}
      {hasCollections && (
        <div className={cn("flex flex-wrap", VEHICLE_DETAIL.tagGap)}>
          {vehicle.collections!.map(({ collection }) => (
            <div
              key={collection.id}
              className={cn(
                "bg-black/10",
                "py-[4px] px-[10px] pb-[6px]",
                "flex items-center justify-center"
              )}
            >
              <span className={cn(VEHICLE_DETAIL.tag, "text-black leading-[1.2]")}>
                {collection.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

