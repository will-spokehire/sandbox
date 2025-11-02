"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { MapPin } from "lucide-react";

interface VehicleLocationProps {
  owner: {
    firstName: string | null;
    lastName: string | null;
    city: string | null;
    county: string | null;
    postcode: string | null;
    country: {
      id: string;
      name: string;
    } | null;
  };
}

/**
 * Vehicle Location Component
 * 
 * Displays vehicle location information for public view.
 * Shows only: Country, County, City, (First part of) Postcode
 * NO contact information (email, phone) is displayed.
 */
export function VehicleLocation({ owner }: VehicleLocationProps) {
  // Build location array
  const locationParts: string[] = [];
  
  if (owner.city) locationParts.push(owner.city);
  if (owner.county) locationParts.push(owner.county);
  if (owner.country) locationParts.push(owner.country.name);

  // Show only first part of postcode for privacy (e.g., "SW1" from "SW1A 1AA")
  const postcodeArea = owner.postcode?.split(" ")[0];

  if (locationParts.length === 0 && !postcodeArea) {
    return null; // Don't render if no location data
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {locationParts.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-[80px]">Area:</span>
              <span className="font-medium">{locationParts.join(", ")}</span>
            </div>
          )}
          {postcodeArea && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-[80px]">Postcode:</span>
              <span className="font-medium">{postcodeArea}</span>
            </div>
          )}
          {owner.firstName && owner.lastName && (
            <div className="flex items-start gap-2">
              <span className="text-muted-foreground min-w-[80px]">Owner:</span>
              <span className="font-medium">
                {owner.firstName} {owner.lastName}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

