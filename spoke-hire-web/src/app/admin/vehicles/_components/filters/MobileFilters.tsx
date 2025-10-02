"use client";

import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { cn } from "~/lib/utils";

interface MobileFiltersProps {
  children: React.ReactNode;
  filtersOpen: boolean;
  onToggle: (open: boolean) => void;
  activeCount: number;
}

/**
 * Mobile Filters
 * 
 * Collapsible filter panel for mobile devices
 */
export function MobileFilters({
  children,
  filtersOpen,
  onToggle,
  activeCount,
}: MobileFiltersProps) {
  return (
    <Collapsible
      open={filtersOpen}
      onOpenChange={onToggle}
      className="md:hidden"
    >
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Filters</span>
            {activeCount > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-[20px] flex items-center justify-center px-1.5"
              >
                {activeCount}
              </Badge>
            )}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              filtersOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="pt-4">
        <div className="flex flex-col gap-3">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );
}

