"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface StarRatingProps {
  /** Rating value (0-5, supports decimals for partial stars) */
  rating: number
  /** Size variant */
  size?: "sm" | "md" | "lg"
  /** Additional CSS classes */
  className?: string
  /** Show numeric rating alongside stars */
  showValue?: boolean
  /** Color for filled stars */
  color?: "black" | "gold"
}

/**
 * Star icon component with fill support
 */
function StarIcon({
  filled,
  partial,
  className,
  color,
}: {
  filled: boolean
  partial?: number
  className?: string
  color: "black" | "gold"
}) {
  const fillColor = color === "gold" ? "#FFD700" : "currentColor"
  const strokeColor = color === "gold" ? "#FFD700" : "currentColor"

  if (partial !== undefined && partial > 0 && partial < 1) {
    // Partial star using gradient
    const gradientId = `star-gradient-${Math.random().toString(36).substr(2, 9)}`
    return (
      <svg
        className={className}
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId}>
            <stop offset={`${partial * 100}%`} stopColor={fillColor} />
            <stop offset={`${partial * 100}%`} stopColor="transparent" />
          </linearGradient>
        </defs>
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill={`url(#${gradientId})`}
          stroke={strokeColor}
          strokeWidth={1.5}
        />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill={filled ? fillColor : "none"}
      stroke={strokeColor}
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

/**
 * StarRating component for displaying ratings
 *
 * Features:
 * - 5-star display with filled/empty states
 * - Support for partial stars (e.g., 4.5)
 * - Multiple size variants
 * - Accessible with aria-label
 * - Optional numeric value display
 *
 * @example
 * <StarRating rating={4.5} />
 *
 * @example
 * <StarRating rating={5} size="lg" showValue />
 *
 * @example
 * <StarRating rating={3.7} color="gold" />
 */
export function StarRating({
  rating,
  size = "md",
  className,
  showValue = false,
  color = "black",
}: StarRatingProps) {
  const clampedRating = Math.max(0, Math.min(5, rating))
  const fullStars = Math.floor(clampedRating)
  const partialStar = clampedRating - fullStars

  const sizeClasses = {
    sm: "size-4",
    md: "size-5",
    lg: "size-6",
  }[size]

  const gapClasses = {
    sm: "gap-0.5",
    md: "gap-1",
    lg: "gap-1.5",
  }[size]

  const textClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[size]

  return (
    <div
      className={cn("flex items-center", gapClasses, className)}
      role="img"
      aria-label={`${clampedRating} out of 5 stars`}
    >
      <div className={cn("flex items-center", gapClasses)}>
        {Array.from({ length: 5 }, (_, i) => {
          const starIndex = i + 1
          const isFull = starIndex <= fullStars
          const isPartial = starIndex === fullStars + 1 && partialStar > 0

          return (
            <StarIcon
              key={i}
              filled={isFull}
              partial={isPartial ? partialStar : undefined}
              className={cn(sizeClasses, color === "black" && "text-spoke-black")}
              color={color}
            />
          )
        })}
      </div>
      {showValue && (
        <span className={cn(textClasses, "text-spoke-black ml-1")}>
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default StarRating

