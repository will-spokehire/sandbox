"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface CarouselDotsProps {
  /** Total number of items/slides */
  total: number
  /** Current active index (0-indexed) */
  current: number
  /** Additional CSS classes */
  className?: string
  /** Click handler for dot navigation */
  onDotClick?: (index: number) => void
  /** Maximum number of dots to show */
  maxDots?: number
}

/**
 * CarouselDots component for mobile scroll indicators
 *
 * Features:
 * - Variable dot sizes (4px to 10px)
 * - Current dot largest, sizes decrease outward
 * - Smooth size transitions
 * - Optional click navigation
 *
 * @example
 * <CarouselDots total={5} current={2} />
 *
 * @example
 * <CarouselDots
 *   total={10}
 *   current={currentSlide}
 *   onDotClick={(index) => setCurrentSlide(index)}
 * />
 */
export function CarouselDots({
  total,
  current,
  className,
  onDotClick,
  maxDots = 7,
}: CarouselDotsProps) {
  // Calculate which dots to show and their sizes
  const getDotSizes = (): { index: number; size: number }[] => {
    const dots: { index: number; size: number }[] = []
    const sizes = [10, 8, 6, 4] // Sizes from largest to smallest

    if (total <= maxDots) {
      // Show all dots with variable sizes based on distance from current
      for (let i = 0; i < total; i++) {
        const distance = Math.abs(i - current)
        const sizeIndex = Math.min(distance, sizes.length - 1)
        dots.push({ index: i, size: sizes[sizeIndex] })
      }
    } else {
      // Show subset of dots centered around current
      const halfVisible = Math.floor(maxDots / 2)
      let start = Math.max(0, current - halfVisible)
      let end = Math.min(total - 1, current + halfVisible)

      // Adjust if we're near the edges
      if (current < halfVisible) {
        end = Math.min(total - 1, maxDots - 1)
      } else if (current > total - 1 - halfVisible) {
        start = Math.max(0, total - maxDots)
      }

      for (let i = start; i <= end; i++) {
        const distance = Math.abs(i - current)
        const sizeIndex = Math.min(distance, sizes.length - 1)
        dots.push({ index: i, size: sizes[sizeIndex] })
      }
    }

    return dots
  }

  const dots = getDotSizes()

  return (
    <div
      className={cn("flex items-center justify-center gap-2", className)}
      role="tablist"
      aria-label="Carousel navigation"
    >
      {dots.map(({ index, size }) => {
        const isActive = index === current

        return (
          <button
            key={index}
            type="button"
            className={cn(
              "rounded-full bg-spoke-black transition-all duration-200",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-spoke-black/50"
            )}
            style={{
              width: `${size}px`,
              height: `${size}px`,
            }}
            onClick={() => onDotClick?.(index)}
            disabled={!onDotClick}
            role="tab"
            aria-selected={isActive}
            aria-label={`Go to slide ${index + 1}`}
            tabIndex={isActive ? 0 : -1}
          />
        )
      })}
    </div>
  )
}

export default CarouselDots

