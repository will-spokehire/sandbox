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
 */
export function MobileScrollDots({
  className,
  state,
  totalItems = 0,
  currentIndex = 0,
}: MobileScrollDotsProps) {
  // Auto-determine state from currentIndex and totalItems if state not provided
  const determinedState = React.useMemo(() => {
    if (state) return state
    if (currentIndex === 0) return "start"
    if (currentIndex >= totalItems - 1) return "end"
    return "middle"
  }, [state, currentIndex, totalItems])

  // Render dots based on state
  if (determinedState === "middle") {
    return (
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          className
        )}
        data-name="mobile-scroll-dots/state=middle"
      >
        <div className="w-1 h-1 rounded-full bg-spoke-black" />
        <div className="w-1.5 h-1.5 rounded-full bg-spoke-black" />
        <div className="w-2 h-2 rounded-full bg-spoke-black" />
        <div className="w-2.5 h-2.5 rounded-full bg-spoke-black" />
        <div className="w-2 h-2 rounded-full bg-spoke-black" />
        <div className="w-1.5 h-1.5 rounded-full bg-spoke-black" />
        <div className="w-1 h-1 rounded-full bg-spoke-black" />
      </div>
    )
  }

  // Start state (or default)
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2",
        className
      )}
      data-name="mobile-scroll-dots/state=start"
    >
      <div className="w-2.5 h-2.5 rounded-full bg-spoke-black" />
      <div className="w-2 h-2 rounded-full bg-spoke-black" />
      <div className="w-1.5 h-1.5 rounded-full bg-spoke-black" />
      <div className="w-1 h-1 rounded-full bg-spoke-black" />
    </div>
  )
}

