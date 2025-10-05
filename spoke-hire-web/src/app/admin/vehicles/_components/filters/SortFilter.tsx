"use client";

import { SingleSelectFilter } from "./SingleSelectFilter";

interface SortFilterProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  hasDistanceFilter?: boolean;
}

/**
 * Sort Filter Component
 * 
 * Single dropdown with combined sort field and order
 */
export function SortFilter({
  sortBy,
  sortOrder,
  onSortChange,
  hasDistanceFilter = false,
}: SortFilterProps) {
  // Combine sort field and order into a single value
  const currentValue = sortBy === "distance" ? "distance" : `${sortBy}-${sortOrder}`;

  const sortOptions = [
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
    { value: "updatedAt-desc", label: "Recently Updated" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
    { value: "price-desc", label: "Price (High-Low)" },
    { value: "price-asc", label: "Price (Low-High)" },
    ...(hasDistanceFilter ? [{ value: "distance", label: "Distance (Nearest)" }] : []),
  ];

  const handleChange = (value?: string) => {
    if (!value) return;
    
    if (value === "distance") {
      onSortChange("distance", "asc");
    } else {
      const [field, order] = value.split("-");
      onSortChange(field ?? "createdAt", order as "asc" | "desc" ?? "desc");
    }
  };

  return (
    <SingleSelectFilter
      label="Sort"
      value={currentValue}
      options={sortOptions}
      onChange={handleChange}
      placeholder="Sort by"
      className="md:w-[200px]"
    />
  );
}
