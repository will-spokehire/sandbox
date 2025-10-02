import { type VehicleStatus } from "@prisma/client";
import { Badge } from "~/components/ui/badge";
import { getStatusVariant, getStatusLabel } from "~/lib/vehicles";

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

/**
 * Vehicle Status Badge
 * 
 * Displays a colored badge for vehicle status
 */
export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  return (
    <Badge variant={getStatusVariant(status)} className={className}>
      {getStatusLabel(status)}
    </Badge>
  );
}

