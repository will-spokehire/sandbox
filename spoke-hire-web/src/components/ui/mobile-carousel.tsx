"use client"

import * as React from "react"
import useEmblaCarousel from "embla-carousel-react"
import { cn } from "~/lib/utils"
import { EmblaCarouselDots } from "./embla-carousel-dots"

export interface MobileCarouselProps {
  /** Items to render in the carousel */
  children: React.ReactNode
  /** Additional CSS classes for the container */
  className?: string
  /** Additional CSS classes for the slides container */
  slidesClassName?: string
  /** Additional CSS classes for each slide */
  slideClassName?: string
  /** Gap between dots and carousel (default: 20px) */
  dotsGap?: string
  /** Whether to show dots (default: true) */
  showDots?: boolean
  /** Callback when slide changes */
  onSlideChange?: (index: number) => void
}

/**
 * MobileCarousel - Embla-powered carousel with iOS-style dots
 * 
 * A reusable mobile carousel component that:
 * - Uses Embla Carousel for smooth touch/swipe
 * - Shows iOS-style sliding dots (max 3)
 * - Snaps to slides
 * - Works with any content
 * 
 * @example
 * <MobileCarousel>
 *   {items.map(item => (
 *     <div key={item.id}>{item.content}</div>
 *   ))}
 * </MobileCarousel>
 */
export function MobileCarousel({
  children,
  className,
  slidesClassName,
  slideClassName,
  dotsGap = "20px",
  showDots = true,
  onSlideChange,
}: MobileCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
  })

  // Track slide changes
  React.useEffect(() => {
    if (!emblaApi || !onSlideChange) return

    const onSelect = () => {
      onSlideChange(emblaApi.selectedScrollSnap())
    }

    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSlideChange])

  // Convert children to array for mapping
  const slides = React.Children.toArray(children)

  return (
    <div className={cn("flex flex-col w-full", className)} style={{ gap: dotsGap }}>
      {/* Embla viewport */}
      <div ref={emblaRef} className="overflow-hidden w-full">
        <div className={cn("flex", slidesClassName)}>
          {slides.map((child, index) => (
            <div
              key={index}
              className={cn(
                index < slides.length - 1 ? "mr-4" : "",
                slideClassName
              )}
              style={{ flex: "0 0 100%", minWidth: 0 }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* iOS-style dots */}
      {showDots && slides.length > 1 && (
        <EmblaCarouselDots emblaApi={emblaApi} />
      )}
    </div>
  )
}

export default MobileCarousel
