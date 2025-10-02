"use client";

import { useMemo } from "react";
import { SingleSelectFilter } from "./SingleSelectFilter";
import { cn } from "~/lib/utils";
import { useIsMobile } from "~/hooks/useMediaQuery";
import type { YearRangeFilterProps } from "./types";

/**
 * Year Range Filter
 * 
 * Combined year from/to filter
 */
export function YearRangeFilter({
  yearFrom,
  yearTo,
  onYearFromChange,
  onYearToChange,
  className,
}: YearRangeFilterProps) {
  const isMobile = useIsMobile();
  
  // Generate year options (from 1900 to current year + 1)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from(
      { length: currentYear - 1900 + 2 },
      (_, i) => {
        const year = (currentYear + 1 - i).toString();
        return { value: year, label: year };
      }
    );
  }, []);

  return (
    <div className={cn("flex gap-3", isMobile && "w-full", className)}>
      <SingleSelectFilter
        label="Year from"
        value={yearFrom}
        options={yearOptions}
        onChange={onYearFromChange}
        placeholder="Year from"
        className={isMobile ? "flex-1" : "w-[130px]"}
      />
      <SingleSelectFilter
        label="Year to"
        value={yearTo}
        options={yearOptions}
        onChange={onYearToChange}
        placeholder="Year to"
        className={isMobile ? "flex-1" : "w-[130px]"}
      />
    </div>
  );
}

