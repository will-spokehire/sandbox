'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import { MobileCarousel } from '~/components/ui/mobile-carousel'

interface FeaturedVehiclesCarouselProps {
  children: React.ReactNode
  /** Number of items for calculating if scroll is needed */
  itemCount: number
  /** Show mobile carousel button */
  showMobileButton?: boolean
}

/**
 * FeaturedVehiclesCarousel - Client Component
 * 
 * Handles only the interactive carousel functionality:
 * - Desktop: Scroll arrows, scroll state, ResizeObserver
 * - Mobile: MobileCarousel with swipe and dots
 * 
 * The vehicle cards are passed as children (server-rendered).
 * This component only manages the carousel interaction, not the content.
 */
export function FeaturedVehiclesCarousel({ 
  children, 
  itemCount,
  showMobileButton = true 
}: FeaturedVehiclesCarouselProps) {
  const desktopCarouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)
  const [needsScroll, setNeedsScroll] = React.useState(false)

  // Convert children to array for mobile carousel
  const childrenArray = React.Children.toArray(children)

  const checkScrollability = React.useCallback(() => {
    const desktopContainer = desktopCarouselRef.current
    
    if (desktopContainer) {
      const computedStyle = window.getComputedStyle(desktopContainer)
      const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
      
      if (isVisible && desktopContainer.scrollWidth > 0) {
        const desktopScrollLeft = desktopContainer.scrollLeft
        const desktopScrollWidth = desktopContainer.scrollWidth
        const desktopClientWidth = desktopContainer.clientWidth
        
        const scrollThreshold = 5
        const canScroll = desktopScrollWidth > desktopClientWidth + scrollThreshold
        
        setNeedsScroll(canScroll)
        
        if (canScroll) {
          const canScrollLeftValue = desktopScrollLeft > scrollThreshold
          const maxScroll = desktopScrollWidth - desktopClientWidth
          const canScrollRightValue = desktopScrollLeft < maxScroll - scrollThreshold
          
          setCanScrollLeft(canScrollLeftValue)
          setCanScrollRight(canScrollRightValue)
        } else {
          setCanScrollLeft(false)
          setCanScrollRight(false)
        }
      }
    }
  }, [])

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        checkScrollability()
      }, 50)
    })

    if (desktopCarouselRef.current) {
      resizeObserver.observe(desktopCarouselRef.current)
    }
    
    const desktopCarousel = desktopCarouselRef.current

    const checkAfterLayout = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          checkScrollability()
        }, 150)
      })
    }

    checkAfterLayout()

    if (desktopCarousel) {
      desktopCarousel.addEventListener('scroll', checkScrollability)
    }
    window.addEventListener('resize', checkAfterLayout)

    const allImages = desktopCarousel?.querySelectorAll('img') ?? []
    allImages.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', checkScrollability, { once: true })
      }
    })

    return () => {
      resizeObserver.disconnect()
      if (desktopCarousel) {
        desktopCarousel.removeEventListener('scroll', checkScrollability)
      }
      window.removeEventListener('resize', checkAfterLayout)
    }
  }, [checkScrollability, itemCount])

  const scrollLeft = () => {
    const container = desktopCarouselRef.current
    if (container) {
      const firstCard = container.querySelector('[data-vehicle-card]') as HTMLElement
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth
        const gap = 21
        container.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' })
      } else {
        container.scrollBy({ left: -320, behavior: 'smooth' })
      }
    }
  }

  const scrollRight = () => {
    const container = desktopCarouselRef.current
    if (container) {
      const firstCard = container.querySelector('[data-vehicle-card]') as HTMLElement
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth
        const gap = 21
        container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: 320, behavior: 'smooth' })
      }
    }
  }

  if (itemCount === 0) return null

  return (
    <div className="w-full flex flex-col gap-[10px]">
      {/* Desktop: Arrows above carousel */}
      {needsScroll && (
        <div className="hidden md:flex items-center justify-between w-full px-0 py-[10px]">
          {/* Left Arrow */}
          <button
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            className={cn(
              "h-[15px] w-[101px] flex items-center justify-center shrink-0 relative",
              "transition-opacity",
              !canScrollLeft && "opacity-30 cursor-not-allowed"
            )}
            aria-label="Scroll left"
          >
            <Image
              src="/arrow-left.svg"
              alt="Previous"
              width={101}
              height={15}
              className="w-full h-full"
            />
          </button>

          {/* Right Arrow */}
          <button
            onClick={scrollRight}
            className={cn(
              "h-[15px] w-[101px] flex items-center justify-center shrink-0 relative",
              "transition-opacity",
              !canScrollRight && "opacity-30"
            )}
            aria-label="Scroll right"
          >
            <Image
              src="/arrow-right.svg"
              alt="Next"
              width={101}
              height={15}
              className="w-full h-full"
            />
          </button>
        </div>
      )}

      {/* Desktop Carousel Container */}
      <div className="hidden md:block w-full">
        <div
          ref={desktopCarouselRef}
          className="flex overflow-x-auto gap-[21px] w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              data-vehicle-card
              className="flex-shrink-0"
              style={{ 
                width: 'calc((100% - 63px) / 4)',
                minWidth: 'min(calc((100% - 63px) / 4), 350px)',
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Single card with scroll dots */}
      <div className="md:hidden w-full">
        <MobileCarousel dotsGap="20px">
          {childrenArray}
        </MobileCarousel>
      </div>
    </div>
  )
}

export default FeaturedVehiclesCarousel
