"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface StatsBadgeProps {
  /** Icon element to display */
  icon: React.ReactNode
  /** Badge label text */
  label: string
  /** Additional CSS classes */
  className?: string
}

export interface StatsBadgeGroupProps {
  /** Array of badge items */
  items: StatsBadgeProps[]
  /** Additional CSS classes */
  className?: string
  /** Show dividers between badges */
  showDividers?: boolean
}

/**
 * Individual StatsBadge component
 *
 * Features:
 * - Icon + text in horizontal layout
 * - Degular font, 20px, uppercase
 * - Pill format with rounded corners
 *
 * @example
 * <StatsBadge
 *   icon={<CarIcon className="size-3.5" />}
 *   label="10,000+ Vehicles"
 * />
 */
export function StatsBadge({ icon, label, className }: StatsBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full px-2.5 py-1.5 h-[30px]",
        className
      )}
    >
      <span className="shrink-0 text-spoke-black [&>svg]:!w-[14px] [&>svg]:!h-[14px] [&>svg]:!max-w-[14px] [&>svg]:!max-h-[14px] [&>img]:!w-[14px] [&>img]:!h-[14px] [&>img]:!max-w-[14px] [&>img]:!max-h-[14px] md:[&>svg]:!w-[14px] md:[&>svg]:!h-[14px] md:[&>img]:!w-[14px] md:[&>img]:!h-[14px]">{icon}</span>
      <span className="font-degular text-[20px] leading-[1.5] uppercase text-spoke-black whitespace-nowrap">
        {label}
      </span>
    </div>
  )
}

/**
 * Vertical divider for stats badge group
 */
function StatsDivider() {
  return (
    <div
      className="h-4 w-px bg-spoke-black/30 rotate-90"
      aria-hidden="true"
    />
  )
}

/**
 * StatsBadgeGroup component for displaying multiple statistics
 *
 * Features:
 * - Horizontal layout with optional dividers
 * - Responsive wrapping
 * - Consistent spacing
 *
 * @example
 * <StatsBadgeGroup
 *   items={[
 *     { icon: <CarIcon />, label: "10,000+ Vehicles" },
 *     { icon: <UserIcon />, label: "7,500+ Verified Owners" },
 *     { icon: <MapIcon />, label: "Nationwide Coverage" },
 *     { icon: <StarIcon />, label: "2,000+ 5* Reviews" },
 *   ]}
 *   showDividers
 * />
 */
export function StatsBadgeGroup({
  items,
  className,
  showDividers = true,
}: StatsBadgeGroupProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-2.5",
        className
      )}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <StatsBadge {...item} />
          {showDividers && index < items.length - 1 && <StatsDivider />}
        </React.Fragment>
      ))}
    </div>
  )
}

export default StatsBadge

