"use client"

import * as React from "react"
import { cn } from "~/lib/utils"
import type { EmblaCarouselType } from "embla-carousel"

export interface EmblaCarouselDotsProps {
  /** Embla carousel API instance */
  emblaApi: EmblaCarouselType | undefined
  /** Additional CSS classes */
  className?: string
  /** Maximum visible dots (default: 5) */
  maxDots?: number
}

/**
 * EmblaCarouselDots - Simple iOS-style pagination dots
 * 
 * Features:
 * - Shows up to maxDots visible dots (default: 5)
 * - Active dot is largest, sizes decrease with distance
 * - Sliding window keeps active dot centered when possible
 * - Works with any number of items
 * 
 * Dot sizes: 8px (active), 6px (adjacent), 4px (far)
 */
export function EmblaCarouselDots({
  emblaApi,
  className,
  maxDots = 5,
}: EmblaCarouselDotsProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])

  const onSelect = React.useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return

    setScrollSnaps(emblaApi.scrollSnapList())
    onSelect()

    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", () => {
      setScrollSnaps(emblaApi.scrollSnapList())
      onSelect()
    })

    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  const totalSlides = scrollSnaps.length

  // Don't render if 0 or 1 slides
  if (totalSlides <= 1) {
    return null
  }

  // Calculate which dots to show and their sizes
  const getVisibleDots = () => {
    const dots: { index: number; size: number }[] = []
    
    // If total slides fit within maxDots, show all
    if (totalSlides <= maxDots) {
      for (let i = 0; i < totalSlides; i++) {
        const distance = Math.abs(i - selectedIndex)
        const size = distance === 0 ? 10  : distance === 1 ? 4 : 2
        dots.push({ index: i, size })
      }
      return dots
    }

    // Otherwise, show a sliding window centered on selectedIndex
    const halfWindow = Math.floor(maxDots / 2)
    let start = selectedIndex - halfWindow
    let end = selectedIndex + halfWindow

    // Adjust if near edges
    if (start < 0) {
      start = 0
      end = maxDots - 1
    } else if (end >= totalSlides) {
      end = totalSlides - 1
      start = totalSlides - maxDots
    }

    for (let i = start; i <= end; i++) {
      const distance = Math.abs(i - selectedIndex)
      // Size based on distance: active = 8, adjacent = 6, far = 4
      const size = distance === 0 ? 10 : distance === 1 ? 8 : 4
      dots.push({ index: i, size })
    }

    return dots
  }

  const dots = getVisibleDots()

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-[6px]",
        className
      )}
      role="tablist"
      aria-label="Carousel navigation"
    >
      {dots.map(({ index, size }) => (
        <div
          key={index}
          className={cn(
            "rounded-full transition-all duration-400 ease-out",
            index === selectedIndex ? "bg-spoke-black" : "bg-gray-400"
          )}
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
          role="tab"
          aria-selected={index === selectedIndex}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  )
}

export default EmblaCarouselDots
