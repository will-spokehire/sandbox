"use client";

import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { type VehicleListItem } from "~/types/vehicle";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Card, CardContent } from "~/components/ui/card";
import { VehicleStatusBadge } from "./VehicleStatusBadge";
import {
  formatPrice,
  formatRegistration,
  formatOwnerName,
  formatLocation,
  getVehicleImageUrl,
} from "~/lib/vehicles";

interface VehicleCardProps {
  vehicle: VehicleListItem;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * Vehicle Card
 * 
 * Card layout for mobile devices
 */
export function VehicleCard({
  vehicle,
  onView,
  onEdit,
  onDelete,
}: VehicleCardProps) {
  const imageUrl = getVehicleImageUrl(vehicle.media);
  const ownerName = formatOwnerName(
    vehicle.owner.firstName,
    vehicle.owner.lastName,
    vehicle.owner.email
  );
  const location = formatLocation(
    vehicle.owner.postcode,
    vehicle.owner.city,
    vehicle.owner.country
  );

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onView?.(vehicle.id)}
    >
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image */}
          <div className="relative h-32 w-40 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
            <Image
              src={imageUrl}
              alt={vehicle.name}
              fill
              className="object-cover"
              sizes="160px"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header with title and actions */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base text-foreground truncate">
                  {vehicle.name}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {vehicle.make.name} {vehicle.model.name}
                </p>
              </div>
              
              {/* Actions */}
              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onView?.(vehicle.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit?.(vehicle.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Vehicle
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete?.(vehicle.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Year:</span>
                <span className="font-medium">{vehicle.year}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Registration:</span>
                <span className="font-medium font-mono text-xs">
                  {formatRegistration(vehicle.registration)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <VehicleStatusBadge status={vehicle.status} />
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-semibold text-base">
                  {formatPrice(vehicle.price)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm pt-1 border-t">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium text-xs truncate max-w-[150px]">
                  {location}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Owner:</span>
                <span className="font-medium text-xs truncate max-w-[150px]">
                  {ownerName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

