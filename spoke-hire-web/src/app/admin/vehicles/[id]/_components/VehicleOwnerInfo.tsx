"use client";

import { Mail, Phone, User, MapPin, Car } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Separator } from "~/components/ui/separator";
import { Button } from "~/components/ui/button";
import { formatOwnerName, getInitials, formatPrice } from "~/lib/vehicles";
import { type VehicleDetail } from "~/types/vehicle";
import { api } from "~/trpc/react";

interface VehicleOwnerInfoProps {
  owner: VehicleDetail["owner"];
  vehicleId: string;
}

/**
 * Vehicle Owner Information Card
 * 
 * Displays owner contact details and account information
 */
export function VehicleOwnerInfo({ owner, vehicleId }: VehicleOwnerInfoProps) {
  const ownerName = formatOwnerName(owner.firstName, owner.lastName, owner.email);
  const initials = getInitials(owner.firstName, owner.lastName);

  // Fetch other vehicles by this owner
  const { data: ownerVehicles } = api.vehicle.list.useQuery(
    {
      ownerId: owner.id,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc",
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );

  // Filter out the current vehicle and limit to 5
  const otherVehicles = ownerVehicles?.vehicles
    .filter((v) => v.id !== vehicleId)
    .slice(0, 5) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span>Owner Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Owner Header with Avatar */}
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              {ownerName}
            </h3>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {owner.userType}
              </Badge>
              <Badge
                variant={owner.status === "ACTIVE" ? "default" : "secondary"}
                className="text-xs"
              >
                {owner.status}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Details */}
        <dl className="space-y-3">
          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <dt className="text-xs text-muted-foreground mb-0.5">Email</dt>
              <dd className="text-sm">
                <a
                  href={`mailto:${owner.email}`}
                  className="text-primary hover:underline truncate block"
                >
                  {owner.email}
                </a>
              </dd>
            </div>
          </div>

          {/* Phone */}
          {owner.phone && (
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <dt className="text-xs text-muted-foreground mb-0.5">Phone</dt>
                <dd className="text-sm">
                  <a
                    href={`tel:${owner.phone}`}
                    className="text-primary hover:underline"
                  >
                    {owner.phone}
                  </a>
                </dd>
              </div>
            </div>
          )}

          {/* Address */}
          {(owner.street || owner.city || owner.county || owner.postcode || owner.country) && (
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <dt className="text-xs text-muted-foreground mb-0.5">Address</dt>
                <dd className="text-sm text-foreground">
                  {owner.street && <div>{owner.street}</div>}
                  {owner.city && <div>{owner.city}</div>}
                  {owner.county && <div>{owner.county}</div>}
                  {owner.postcode && <div>{owner.postcode}</div>}
                  {owner.country && <div>{owner.country.name}</div>}
                </dd>
              </div>
            </div>
          )}
        </dl>

        {/* Other Vehicles by Owner */}
        {otherVehicles.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Other Vehicles ({otherVehicles.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="h-8 text-xs"
                >
                  <Link href={`/admin/vehicles?ownerId=${owner.id}`}>
                    View All
                  </Link>
                </Button>
              </div>
              <div className="space-y-2">
                {otherVehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/admin/vehicles/${vehicle.id}`}
                    className="block p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {vehicle.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {vehicle.make.name} {vehicle.model.name} • {vehicle.year}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(vehicle.price)}
                        </p>
                        <Badge
                          variant={vehicle.status === "PUBLISHED" ? "default" : "secondary"}
                          className="text-xs mt-1"
                        >
                          {vehicle.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

