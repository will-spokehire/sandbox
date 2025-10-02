import { Skeleton } from "~/components/ui/skeleton";
import { TableBody, TableCell, TableRow } from "~/components/ui/table";

interface VehicleListSkeletonProps {
  rows?: number;
}

/**
 * Vehicle List Skeleton
 * 
 * Loading skeleton for vehicle table
 */
export function VehicleListSkeleton({ rows = 5 }: VehicleListSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell>
            <Skeleton className="h-12 w-12 rounded" />
          </TableCell>
          <TableCell>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-8 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

