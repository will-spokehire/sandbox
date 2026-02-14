'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import { MobileCarousel } from '~/components/ui/mobile-carousel'

interface TestimonialsCarouselProps {
  children: React.ReactNode
  /** Number of items for calculating if scroll is needed */
  itemCount: number
  /** Title to display (for mobile) */
  title?: string
}

/**
 * TestimonialsCarousel - Client Component
 * 
 * Handles only the interactive carousel functionality:
 * - Desktop: Scroll arrows, scroll state, ResizeObserver
 * - Mobile: MobileCarousel with swipe and dots
 * 
 * The testimonial cards are passed as children (server-rendered).
 * This component only manages the carousel interaction, not the content.
 */
export function TestimonialsCarousel({ 
  children, 
  itemCount,
  title
}: TestimonialsCarouselProps) {
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
      const firstCard = container.querySelector('[data-testimonial-card]') as HTMLElement
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth
        const gap = 40
        container.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' })
      } else {
        container.scrollBy({ left: -400, behavior: 'smooth' })
      }
    }
  }

  const scrollRight = () => {
    const container = desktopCarouselRef.current
    if (container) {
      const firstCard = container.querySelector('[data-testimonial-card]') as HTMLElement
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth
        const gap = 40
        container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' })
      } else {
        container.scrollBy({ left: 400, behavior: 'smooth' })
      }
    }
  }

  if (itemCount === 0) return null

  return (
    <div className="w-full flex flex-col gap-[40px] md:gap-[60px] pt-[60px] md:pt-[100px]">
      {/* Title and Arrows Layout - Desktop */}
      {title && (
        <div className="hidden md:flex w-full items-end justify-between">
          <div className="flex flex-col gap-[26px] items-start">
            <h2 className="heading-2 text-spoke-black">
              {title.toUpperCase()}
            </h2>
          </div>
          {/* Arrows positioned on the right, aligned to bottom */}
          {needsScroll && (
            <div className="flex gap-[72px] items-center px-0 py-[10px]">
              {/* Left Arrow */}
              <button
                onClick={scrollLeft}
                disabled={!canScrollLeft}
                className={cn(
                  "h-[40px] w-[100px] flex items-center justify-center shrink-0 relative",
                  "transition-opacity",
                  !canScrollLeft && "opacity-30 cursor-not-allowed"
                )}
                aria-label="Scroll left"
              >
                <Image
                  src="/arrow-left.svg"
                  alt="Previous"
                  width={100}
                  height={40}
                  className="w-full h-full"
                />
              </button>

              {/* Right Arrow */}
              <button
                onClick={scrollRight}
                disabled={!canScrollRight}
                className={cn(
                  "h-[40px] w-[100px] flex items-center justify-center shrink-0 relative",
                  "transition-opacity",
                  !canScrollRight && "opacity-30 cursor-not-allowed"
                )}
                aria-label="Scroll right"
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
        </div>
      )}

      {/* Desktop Carousel Container */}
      <div className="hidden md:block w-full">
        <div
          ref={desktopCarouselRef}
          className="flex overflow-x-auto gap-10 w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {childrenArray.map((child, index) => (
            <div
              key={index}
              data-testimonial-card
              className="flex-shrink-0"
              style={{
                width: 'calc((100% - 80px) / 3)',
                minWidth: 'min(calc((100% - 80px) / 3), 400px)',
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: Title and Single card with scroll dots */}
      <div className="md:hidden flex flex-col gap-[40px] w-full">
        {title && (
          <h2 className="heading-2 text-spoke-black">
            {title.toUpperCase()}
          </h2>
        )}
        <MobileCarousel dotsGap="40px">
          {childrenArray}
        </MobileCarousel>
      </div>
    </div>
  )
}

export default TestimonialsCarousel
