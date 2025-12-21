'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import type { TestimonialsSectionBlockData } from '~/lib/payload-api'
import { TestimonialCard } from '~/components/cards/TestimonialCard'
import { MobileScrollDots } from './MobileScrollDots'
import { LAYOUT_CONSTANTS } from '~/lib/design-tokens'

interface TestimonialsBlockProps {
  data: TestimonialsSectionBlockData
}

/**
 * TestimonialsBlock Component
 *
 * Displays customer testimonials matching Figma design:
 * - Desktop: 3 cards in a row with arrows under title
 * - Mobile: Single card with scroll dots
 */
export function TestimonialsBlock({ data }: TestimonialsBlockProps) {
  const {
    title,
    selectedTestimonials,
    showRatings = true,
  } = data

  if (!selectedTestimonials || selectedTestimonials.length === 0) {
    return null
  }

  return (
    <section className={cn("bg-white pt-[60px] pb-0", LAYOUT_CONSTANTS.contentPadding)}>
      <TestimonialsCarousel
        testimonials={selectedTestimonials}
        showRatings={showRatings}
        title={title}
      />
    </section>
  )
}

/**
 * TestimonialsCarousel Component with Navigation Arrows
 * Arrows positioned under title (like FeaturedVehiclesBlock pattern)
 */
function TestimonialsCarousel({
  testimonials,
  showRatings,
  title,
}: {
  testimonials: TestimonialsSectionBlockData['selectedTestimonials']
  showRatings: boolean
  title?: string
}) {
  const desktopCarouselRef = React.useRef<HTMLDivElement>(null)
  const mobileCarouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)
  const [needsScroll, setNeedsScroll] = React.useState(false)
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const checkScrollability = React.useCallback(() => {
    const desktopContainer = desktopCarouselRef.current
    const mobileContainer = mobileCarouselRef.current

    // Check desktop carousel for arrow states
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

    // Check mobile carousel for scroll dots
    if (mobileContainer) {
      const mobileScrollLeft = mobileContainer.scrollLeft
      const mobileScrollWidth = mobileContainer.scrollWidth
      if (mobileScrollWidth > 0 && testimonials.length > 0) {
        const cardWidth = mobileScrollWidth / testimonials.length
        const newIndex = Math.round(mobileScrollLeft / cardWidth)
        const clampedIndex = Math.max(0, Math.min(newIndex, testimonials.length - 1))
        setCurrentIndex(clampedIndex)
      }
    }
  }, [testimonials.length])

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTimeout(() => {
          checkScrollability()
        }, 50)
      }
    })

    if (desktopCarouselRef.current) {
      resizeObserver.observe(desktopCarouselRef.current)
    }
    if (mobileCarouselRef.current) {
      resizeObserver.observe(mobileCarouselRef.current)
    }

    const desktopCarousel = desktopCarouselRef.current
    const mobileCarousel = mobileCarouselRef.current

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
    if (mobileCarousel) {
      mobileCarousel.addEventListener('scroll', checkScrollability)
    }
    window.addEventListener('resize', checkAfterLayout)

    const allImages = [
      ...(desktopCarousel?.querySelectorAll('img') ?? []),
      ...(mobileCarousel?.querySelectorAll('img') ?? [])
    ]
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
      if (mobileCarousel) {
        mobileCarousel.removeEventListener('scroll', checkScrollability)
      }
      window.removeEventListener('resize', checkAfterLayout)
    }
  }, [checkScrollability, testimonials])

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

  if (testimonials.length === 0) return null

  return (
    <div className="w-full flex flex-col gap-[60px] md:gap-[60px]">
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
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              data-testimonial-card
              className="flex-shrink-0"
              style={{
                width: 'calc((100% - 80px) / 3)',
                minWidth: 'min(calc((100% - 80px) / 3), 400px)',
              }}
            >
              <TestimonialCard
                quote={testimonial.quote}
                authorName={testimonial.author}
                authorRole={testimonial.role}
                rating={showRatings && testimonial.rating ? testimonial.rating : 5}
              />
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
        <div
          ref={mobileCarouselRef}
          className="flex overflow-x-auto gap-0 snap-x snap-mandatory -mx-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="min-w-full snap-center shrink-0"
              style={{ width: '100vw', maxWidth: '100vw' }}
            >
              <div className="w-full px-4 box-border" style={{ maxWidth: '100%' }}>
                <TestimonialCard
                  quote={testimonial.quote}
                  authorName={testimonial.author}
                  authorRole={testimonial.role}
                  rating={showRatings && testimonial.rating ? testimonial.rating : 5}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Scroll Dots */}
        <MobileScrollDots
          currentIndex={currentIndex}
          totalItems={testimonials.length}
        />
      </div>
    </div>
  )
}

export default TestimonialsBlock
