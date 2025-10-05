import { Car } from "lucide-react";
import { Button } from "~/components/ui/button";

interface VehicleEmptyStateProps {
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

/**
 * Vehicle Empty State
 * 
 * Displayed when no vehicles are found
 */
export function VehicleEmptyState({
  hasFilters = false,
  onClearFilters,
}: VehicleEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex justify-center">
        <Car className="h-16 w-16 text-muted-foreground" strokeWidth={1.5} />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {hasFilters ? "No vehicles found" : "No vehicles yet"}
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {hasFilters
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Get started by adding your first vehicle to the system."}
      </p>
      {hasFilters && onClearFilters && (
        <Button variant="outline" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </div>
  );
}

