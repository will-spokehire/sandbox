"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";
import { useIsMobile } from "~/hooks/useMediaQuery";
import type { SingleSelectFilterProps } from "./types";

/**
 * Single Select Filter
 * 
 * Generic single-select dropdown filter
 * Automatically adjusts width for mobile
 */
export function SingleSelectFilter({
  label,
  value,
  options,
  onChange,
  placeholder = "Select...",
  disabled = false,
  className,
}: SingleSelectFilterProps) {
  const isMobile = useIsMobile();

  const handleChange = (newValue: string) => {
    if (newValue === "all") {
      onChange(undefined);
    } else {
      onChange(newValue);
    }
  };

  return (
    <Select
      value={value ?? "all"}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger
        className={cn(isMobile ? "w-full" : undefined, className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">
          <span className="font-medium">{label}</span>
        </SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

