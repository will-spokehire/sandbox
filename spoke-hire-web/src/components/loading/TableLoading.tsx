import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

interface TableLoadingProps {
  rows?: number;
  columns?: number;
  className?: string;
}

/**
 * Table Loading Component
 * 
 * Provides a consistent loading state for data tables.
 * Shows skeleton rows that match the table structure.
 * 
 * @example
 * ```tsx
 * {isLoading ? (
 *   <TableLoading rows={10} columns={6} />
 * ) : (
 *   <DataTable data={data} />
 * )}
 * ```
 */
export function TableLoading({ 
  rows = 10, 
  columns = 6, 
  className 
}: TableLoadingProps) {
  return (
    <div className={`rounded-md border ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columns }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
