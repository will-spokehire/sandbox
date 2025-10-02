"use client";

import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { type VehicleListItem } from "~/types/vehicle";
import { TableCell, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { VehicleStatusBadge } from "./VehicleStatusBadge";
import {
  formatPrice,
  formatRegistration,
  formatOwnerName,
  formatLocation,
  getVehicleImageUrl,
} from "~/lib/vehicles";

interface VehicleTableRowProps {
  vehicle: VehicleListItem;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * Vehicle Table Row
 * 
 * Individual row in the vehicle list table
 */
export function VehicleTableRow({
  vehicle,
  onView,
  onEdit,
  onDelete,
}: VehicleTableRowProps) {
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
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onView?.(vehicle.id)}
    >
      {/* Image */}
      <TableCell>
        <div className="relative h-12 w-12 overflow-hidden rounded border bg-muted">
          <Image
            src={imageUrl}
            alt={vehicle.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      </TableCell>

      {/* Name & Make/Model */}
      <TableCell>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{vehicle.name}</span>
          <span className="text-sm text-muted-foreground">
            {vehicle.make.name} {vehicle.model.name}
          </span>
        </div>
      </TableCell>

      {/* Year */}
      <TableCell>
        <span className="text-sm">{vehicle.year}</span>
      </TableCell>

      {/* Registration */}
      <TableCell>
        <span className="text-sm font-mono">
          {formatRegistration(vehicle.registration)}
        </span>
      </TableCell>

      {/* Status */}
      <TableCell>
        <VehicleStatusBadge status={vehicle.status} />
      </TableCell>

      {/* Price */}
      <TableCell>
        <span className="font-medium">{formatPrice(vehicle.price)}</span>
      </TableCell>

      {/* Location */}
      <TableCell>
        <span className="text-sm">{location}</span>
      </TableCell>

      {/* Owner */}
      <TableCell>
        <div className="flex flex-col">
          <span className="text-sm">{ownerName}</span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {vehicle.owner.email}
          </span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
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
      </TableCell>
    </TableRow>
  );
}

