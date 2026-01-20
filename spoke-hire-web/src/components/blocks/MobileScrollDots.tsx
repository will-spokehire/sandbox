"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

type MobileScrollDotsState = "start" | "middle" | "end"

interface MobileScrollDotsProps {
  className?: string
  state?: MobileScrollDotsState
  totalItems?: number
  currentIndex?: number
}

/**
 * MobileScrollDots Component
 * 
 * Pagination indicator for mobile carousels with varying dot sizes.
 * Based on Figma design with three states: start, middle, end.
 * 
 * Dot sizes: 4px, 6px, 8px, 10px
 * Gap between dots: 8px
 */
export function MobileScrollDots({
  className,
  state,
  totalItems = 0,
  currentIndex = 0,
}: MobileScrollDotsProps) {
  // Clamp currentIndex to valid range
  const clampedIndex = React.useMemo(() => {
    if (totalItems <= 0) return 0
    return Math.max(0, Math.min(currentIndex, totalItems - 1))
  }, [currentIndex, totalItems])

  // Auto-determine state from currentIndex and totalItems if state not provided
  const determinedState = React.useMemo(() => {
    if (state) return state
    if (totalItems <= 1) return "start" // Single item always shows start state
    if (clampedIndex === 0) return "start"
    if (clampedIndex >= totalItems - 1) return "end"
    return "middle"
  }, [state, clampedIndex, totalItems])

  // Common transition classes for smooth animations
  const dotTransition = "transition-all duration-300 ease-in-out"

  // Render dots based on state
  if (determinedState === "middle") {
    // Middle state: 7 dots with sizes 4px, 6px, 8px, 10px, 8px, 6px, 4px (symmetrical)
    // Active dot (10px, black) moves through positions based on currentIndex
    // Calculate which position should be active (0-6)
    let activePosition = 3 // Default to center (position 3)
    
    if (totalItems > 2 && clampedIndex !== undefined) {
      const middleStartIndex = 1
      const middleEndIndex = totalItems - 2
      const middleRange = middleEndIndex - middleStartIndex + 1
      
      if (middleRange > 0) {
        // Map clampedIndex to positions 1-5 (avoiding edge positions 0 and 6)
        // This creates a smooth movement from left-center to right-center
        const relativePosition = middleRange > 1 
          ? (clampedIndex - middleStartIndex) / (middleRange - 1)
          : 0.5 // If only one middle item, center it
        activePosition = Math.round(1 + relativePosition * 4)
        activePosition = Math.max(1, Math.min(5, activePosition)) // Clamp to 1-5
      }
    }

    // Base size pattern: [4px, 6px, 8px, 10px, 8px, 6px, 4px]
    // Active dot is always 10px and black, regardless of position
    const getSizeClass = (size: number) => {
      switch (size) {
        case 4: return "w-[4px] h-[4px]"
        case 6: return "w-[6px] h-[6px]"
        case 8: return "w-[8px] h-[8px]"
        case 10: return "w-[10px] h-[10px]"
        default: return "w-[4px] h-[4px]"
      }
    }
    
    const baseSizes = [4, 6, 8, 10, 8, 6, 4]
    
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          className
        )}
        data-name="mobile-scroll-dots/state=middle"
      >
        {baseSizes.map((baseSize, index) => {
          const isActive = index === activePosition
          // Active dot is always the largest size (10px), regardless of base position
          const size = isActive ? 10 : baseSize
          
          return (
            <div
              key={index}
              className={cn(
                getSizeClass(size),
                "rounded-full",
                dotTransition,
                isActive ? "bg-spoke-black" : "bg-gray-400"
              )}
            />
          )
        })}
      </div>
    )
  }

  if (determinedState === "end") {
    // End state: 4 dots with sizes 4px, 6px, 8px, 10px (smallest to largest)
    // Last dot (10px) is black, others are grey
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          className
        )}
        data-name="mobile-scroll-dots/state=end"
      >
        <div className={cn("w-[4px] h-[4px] rounded-full bg-gray-400", dotTransition)} />
        <div className={cn("w-[6px] h-[6px] rounded-full bg-gray-400", dotTransition)} />
        <div className={cn("w-[8px] h-[8px] rounded-full bg-gray-400", dotTransition)} />
        <div className={cn("w-[10px] h-[10px] rounded-full bg-spoke-black", dotTransition)} />
      </div>
    )
  }

  // Start state: 4 dots with sizes 10px, 8px, 6px, 4px (largest to smallest)
  // First dot (10px) is black, others are grey
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2",
        className
      )}
      data-name="mobile-scroll-dots/state=start"
    >
      <div className={cn("w-[10px] h-[10px] rounded-full bg-spoke-black", dotTransition)} />
      <div className={cn("w-[8px] h-[8px] rounded-full bg-gray-400", dotTransition)} />
      <div className={cn("w-[6px] h-[6px] rounded-full bg-gray-400", dotTransition)} />
      <div className={cn("w-[4px] h-[4px] rounded-full bg-gray-400", dotTransition)} />
    </div>
  )
}

