"use client";

import { MoreHorizontal, Eye, Mail, Phone, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import { type VehicleListItem } from "~/types/vehicle";
import { TableCell, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { VehicleStatusBadge } from "~/components/vehicles/VehicleStatusBadge";
import {
  formatPrice,
  formatRegistration,
  formatOwnerName,
  formatLocation,
  getVehicleImageUrl,
} from "~/lib/vehicles";
import { formatPricingRate } from "~/lib/pricing";
import { getWhatsAppChatUrl } from "~/lib/whatsapp";
import { cn } from "~/lib/utils";

interface VehicleTableRowProps {
  vehicle: VehicleListItem;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  selected?: boolean;
  onToggle?: (id: string) => void;
  onCopyEmail?: (email: string) => void;
  onCopyPhone?: (phone: string) => void;
}

/**
 * Vehicle Table Row
 * 
 * Individual row in the vehicle list table.
 * Uses Link component for proper browser navigation (cmd+click, right-click, etc.)
 * Memoized to prevent unnecessary re-renders when other rows change.
 */
export const VehicleTableRow = memo(function VehicleTableRow({
  vehicle,
  onView: _onView,
  onEdit: _onEdit,
  onDelete: _onDelete,
  selected = false,
  onToggle,
  onCopyEmail,
  onCopyPhone,
}: VehicleTableRowProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
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
    <TableRow className="hover:bg-muted/50">
      {/* Checkbox */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggle?.(vehicle.id)}
          aria-label={`Select ${vehicle.name}`}
        />
      </TableCell>

      {/* Image */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <div className="relative aspect-[3/2] w-28 overflow-hidden rounded-md border bg-muted">
            <Image
              src={imageUrl}
              alt={vehicle.name}
              fill
              className={cn(
                "object-cover transition-opacity duration-500",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              sizes="112px"
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>
        </Link>
      </TableCell>

      {/* Name & Make/Model */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block hover:underline">
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{vehicle.name}</span>
            <span className="text-sm text-muted-foreground">
              {vehicle.make.name} {vehicle.model.name}
            </span>
          </div>
        </Link>
      </TableCell>

      {/* Year */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <span className="text-sm">{vehicle.year}</span>
        </Link>
      </TableCell>

      {/* Registration */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <span className="text-sm font-mono">
            {formatRegistration(vehicle.registration)}
          </span>
        </Link>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <VehicleStatusBadge status={vehicle.status} />
        </Link>
      </TableCell>

      {/* Price */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <span className="font-medium">{formatPrice(vehicle.price)}</span>
        </Link>
      </TableCell>

      {/* Hourly Rate */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <span className="text-sm">
            {formatPricingRate(
              vehicle.hourlyRate 
                ? (typeof vehicle.hourlyRate === 'number' ? vehicle.hourlyRate : vehicle.hourlyRate.toNumber())
                : undefined
            )}
          </span>
        </Link>
      </TableCell>

      {/* Daily Rate */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <span className="text-sm">
            {formatPricingRate(
              vehicle.dailyRate 
                ? (typeof vehicle.dailyRate === 'number' ? vehicle.dailyRate : vehicle.dailyRate.toNumber())
                : undefined
            )}
          </span>
        </Link>
      </TableCell>

      {/* Location */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <div className="flex flex-col">
            <span className="text-sm">{location}</span>
            {vehicle.distance !== undefined && vehicle.distance !== null && (
              <span className="text-xs text-muted-foreground">
                {vehicle.distance.toFixed(1)} miles away
              </span>
            )}
          </div>
        </Link>
      </TableCell>

      {/* Owner */}
      <TableCell>
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block">
          <div className="flex flex-col">
            <span className="text-sm">{ownerName}</span>
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {vehicle.owner.email}
            </span>
          </div>
        </Link>
      </TableCell>

      {/* Actions */}
      <TableCell>
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
            <DropdownMenuItem asChild>
              <Link href={`/admin/vehicles/${vehicle.id}`} className="cursor-pointer">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Contact Owner</DropdownMenuLabel>
            
            {/* Copy Email */}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onCopyEmail?.(vehicle.owner.email);
              }}
            >
              <Mail className="mr-2 h-4 w-4" />
              Copy Email
            </DropdownMenuItem>
            
            {/* Copy Phone */}
            {vehicle.owner.phone && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onCopyPhone?.(vehicle.owner.phone!);
                }}
              >
                <Phone className="mr-2 h-4 w-4" />
                Copy Phone
              </DropdownMenuItem>
            )}
            
            {/* WhatsApp Actions */}
            {vehicle.owner.phone && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(getWhatsAppChatUrl(vehicle.owner.phone!), '_blank');
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp Chat
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

