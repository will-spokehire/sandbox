"use client";

import { X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useIsMobile } from "~/hooks/useMediaQuery";

interface FilterActionsProps {
  hasActiveFilters: boolean;
  onClear: () => void;
}

/**
 * Filter Actions
 * 
 * Clear filters button
 */
export function FilterActions({
  hasActiveFilters,
  onClear,
}: FilterActionsProps) {
  const isMobile = useIsMobile();

  if (!hasActiveFilters) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClear}
      className={cn(isMobile ? "w-full" : "ml-auto")}
    >
      <X className="mr-2 h-4 w-4" />
      Clear Filters
    </Button>
  );
}

