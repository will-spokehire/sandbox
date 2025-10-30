import { type VehicleStatus } from "@prisma/client";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface VehicleStatusBadgeProps {
  status: VehicleStatus;
  className?: string;
}

/**
 * Vehicle Status Badge Component
 * 
 * Displays vehicle status with appropriate color coding:
 * - DRAFT: gray
 * - IN_REVIEW: yellow
 * - PUBLISHED: green
 * - DECLINED: red
 * - ARCHIVED: slate (displays as "Deactivated")
 */
export function VehicleStatusBadge({ status, className }: VehicleStatusBadgeProps) {
  const getStatusConfig = (status: VehicleStatus) => {
    switch (status) {
      case "DRAFT":
        return {
          label: "Draft",
          variant: "secondary" as const,
          className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
        };
      case "IN_REVIEW":
        return {
          label: "In Review",
          variant: "default" as const,
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
        };
      case "PUBLISHED":
        return {
          label: "Published",
          variant: "default" as const,
          className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
        };
      case "DECLINED":
        return {
          label: "Declined",
          variant: "destructive" as const,
          className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
        };
      case "ARCHIVED":
        return {
          label: "Deactivated",
          variant: "secondary" as const,
          className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
        };
      default:
        return {
          label: status,
          variant: "secondary" as const,
          className: "",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

