"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface FilterButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the filter is currently active */
  isActive?: boolean
  /** Icon element to display */
  icon?: React.ReactNode
  /** Button variant */
  variant?: "default" | "icon-only"
  /** Additional CSS classes */
  className?: string
}

/**
 * FilterButton component for filter controls
 *
 * Features:
 * - Icon-only and icon+text variants
 * - Active/inactive states
 * - Black background when active
 * - Matches Figma design system
 *
 * @example
 * // Text button
 * <FilterButton isActive={false}>All Vehicles</FilterButton>
 *
 * @example
 * // Icon + text button
 * <FilterButton icon={<FilterIcon />} isActive>Filters</FilterButton>
 *
 * @example
 * // Icon-only button
 * <FilterButton variant="icon-only" icon={<GridIcon />} isActive={false} />
 */
export function FilterButton({
  children,
  isActive = false,
  icon,
  variant = "default",
  className,
  ...props
}: FilterButtonProps) {
  const isIconOnly = variant === "icon-only" || (!children && icon)

  return (
    <button
      type="button"
      className={cn(
        "filter-btn",
        "transition-colors duration-150",
        isActive && "filter-btn-active",
        isIconOnly && "px-4",
        className
      )}
      aria-pressed={isActive}
      {...props}
    >
      {icon && (
        <span className={cn("shrink-0", !isIconOnly && "mr-2")}>{icon}</span>
      )}
      {!isIconOnly && children}
    </button>
  )
}

export default FilterButton

