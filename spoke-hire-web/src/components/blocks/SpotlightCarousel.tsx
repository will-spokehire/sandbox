'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import { MobileCarousel } from '~/components/ui/mobile-carousel'

interface SpotlightCarouselProps {
  children: React.ReactNode
  /** Number of items for calculating if scroll is needed */
  itemCount: number
  /** Show navigation arrows */
  showArrows?: boolean
  /** Items per view (for calculating scroll) */
  itemsPerView?: number
}

/**
 * SpotlightCarousel - Client Component
 * 
 * Handles only the interactive carousel functionality:
 * - Desktop: Scroll arrows, index-based navigation
 * - Mobile: MobileCarousel with swipe and dots
 * 
 * The spotlight cards are passed as children (server-rendered).
 * This component only manages the carousel interaction, not the content.
 */
export function SpotlightCarousel({ 
  children, 
  itemCount,
  showArrows = true,
  itemsPerView = 4
}: SpotlightCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const desktopScrollRef = React.useRef<HTMLDivElement>(null)

  // Convert children to array for mobile carousel
  const childrenArray = React.Children.toArray(children)

  const maxIndex = Math.max(0, itemCount - itemsPerView)

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  // Scroll container on index change (desktop)
  React.useEffect(() => {
    if (desktopScrollRef.current) {
      const container = desktopScrollRef.current
      const cardElement = container.firstElementChild as HTMLElement
      if (cardElement) {
        const cardWidth = cardElement.offsetWidth + 21 // card width + gap
        const scrollPosition = currentIndex * cardWidth
        container.scrollTo({
          left: scrollPosition,
          behavior: 'smooth',
        })
      }
    }
  }, [currentIndex])

  if (itemCount === 0) return null

  return (
    <>
      {/* Navigation Arrows - Desktop only, positioned between title and cards */}
      {showArrows && itemCount > itemsPerView && (
        <div className="hidden md:flex items-center justify-between px-0 py-[20px] w-full">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              'h-[40px] w-[100px] flex items-center justify-center shrink-0 relative',
              'transition-opacity',
              currentIndex === 0 && 'opacity-30 cursor-not-allowed'
            )}
            aria-label="Previous projects"
          >
            <Image
              src="/arrow-left.svg"
              alt="Previous"
              width={100}
              height={40}
              className="w-full h-full"
            />
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex}
            className={cn(
              'h-[40px] w-[100px] flex items-center justify-center shrink-0 relative',
              'transition-opacity',
              currentIndex >= maxIndex && 'opacity-30 cursor-not-allowed'
            )}
            aria-label="Next projects"
          >
            <Image
              src="/arrow-right.svg"
              alt="Next"
              width={100}
              height={40}
              className="w-full h-full"
            />
          </button>
        </div>
      )}

      {/* Spacer when arrows are not shown - maintains consistent spacing */}
      {(!showArrows || itemCount <= itemsPerView) && (
        <div className="hidden md:block py-[20px] w-full" />
      )}

      {/* Desktop Card Row */}
      <div
        ref={desktopScrollRef}
        className={cn(
          'hidden md:flex gap-[21px] w-full overflow-x-auto snap-x snap-mandatory',
          '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
        )}
      >
        {childrenArray.map((child, index) => {
          const gapTotal = 21 * (itemsPerView - 1)
          const cardWidth = `calc((100% - ${gapTotal}px) / ${itemsPerView})`
          return (
            <div
              key={index}
              className="flex-shrink-0 snap-center"
              style={{ 
                width: cardWidth,
                minWidth: `min(${cardWidth}, 350px)`
              }}
            >
              {child}
            </div>
          )
        })}
      </div>

      {/* Mobile: Single card with scroll dots */}
      <div className="md:hidden mt-[36px] w-full">
        <MobileCarousel dotsGap="36px">
          {childrenArray}
        </MobileCarousel>
      </div>
    </>
  )
}

export default SpotlightCarousel
