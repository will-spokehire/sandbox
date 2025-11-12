"use client";

import { MoreHorizontal, Eye, MapPin, Mail, Phone, MessageCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { memo, useState } from "react";
import { type VehicleListItem } from "~/types/vehicle";
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
import { Card, CardContent } from "~/components/ui/card";
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

interface VehicleCardProps {
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
 * Vehicle Card
 * 
 * Card layout for mobile devices.
 * Uses Link component for proper browser navigation (cmd+click, right-click, etc.)
 * Memoized to prevent unnecessary re-renders when other cards change.
 */
export const VehicleCard = memo(function VehicleCard({
  vehicle,
  onView: _onView,
  onEdit: _onEdit,
  onDelete: _onDelete,
  selected = false,
  onToggle,
  onCopyEmail,
  onCopyPhone,
}: VehicleCardProps) {
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
  
  // Check if vehicle has distance data (from distance filtering)
  const distance = (vehicle as VehicleListItem & { distance?: number }).distance;

  return (
    <Card className={`hover:shadow-md transition-shadow overflow-hidden py-0 relative ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-0">
        {/* Image - Full width for better impact - 4:3 aspect ratio */}
        <div className="relative aspect-[4/3] w-full bg-muted">
          <Link href={`/admin/vehicles/${vehicle.id}`} className="block w-full h-full">
            <Image
              src={imageUrl}
              alt={vehicle.name}
              fill
              className={cn(
                "object-cover transition-opacity duration-500",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              sizes="(max-width: 768px) 100vw, 400px"
              onLoad={() => setIsImageLoaded(true)}
            />
          </Link>
          
          {/* Checkbox overlay - top left */}
          {onToggle && (
            <div className="absolute top-3 left-3 z-10">
              <div 
                className="bg-background/80 backdrop-blur-sm rounded-md p-1.5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={selected}
                  onCheckedChange={() => onToggle(vehicle.id)}
                  aria-label={`Select ${vehicle.name}`}
                />
              </div>
            </div>
          )}
          
          {/* Status badge overlay */}
          <div className={`absolute top-3 z-10 ${onToggle ? 'left-16' : 'left-3'}`}>
            <VehicleStatusBadge status={vehicle.status} />
          </div>
          
          {/* Actions overlay */}
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="secondary" 
                  size="icon" 
                  className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/80 hover:bg-background/90"
                  onClick={(e) => e.stopPropagation()}
                >
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
          </div>
        </div>

        {/* Content */}
        <Link href={`/admin/vehicles/${vehicle.id}`} className="block p-4">
          {/* Title and Pricing */}
          <div className="mb-3">
            <h3 className="font-semibold text-lg text-foreground leading-tight mb-1">
              {vehicle.name}
            </h3>
            <p className="text-sm font-medium text-primary">
              {[
                vehicle.hourlyRate && `£${vehicle.hourlyRate} hourly`,
                vehicle.dailyRate && `£${vehicle.dailyRate} daily`
              ].filter(Boolean).join(' • ') || 'Pricing not set'}
            </p>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3 pb-3 border-b">
            <div>
              <span className="text-muted-foreground text-xs">Registration</span>
              <p className="font-mono font-medium text-xs mt-0.5">
                {formatRegistration(vehicle.registration)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground text-xs">Year</span>
              <p className="font-semibold mt-0.5">{vehicle.year}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Hourly Rate</span>
              <p className="font-medium text-xs mt-0.5">
                {formatPricingRate(
                  vehicle.hourlyRate ? Number(vehicle.hourlyRate) : undefined
                )}
              </p>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground text-xs">Daily Rate</span>
              <p className="font-medium text-xs mt-0.5">
                {formatPricingRate(
                  vehicle.dailyRate ? Number(vehicle.dailyRate) : undefined
                )}
              </p>
            </div>
          </div>
          
          {/* Owner & Location */}
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Location</span>
              <span className="font-medium text-xs truncate ml-2">
                {location}
              </span>
            </div>
            
            {/* Distance (if available) */}
            {distance !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-xs flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Distance
                </span>
                <span className="font-medium text-xs text-primary">
                  {distance.toFixed(1)} miles away
                </span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">Owner</span>
              <span className="font-medium text-xs truncate ml-2">
                {ownerName}
              </span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
});

