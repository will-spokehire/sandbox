'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import type { SpotlightBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'
import { SpotlightCard } from '~/components/cards/SpotlightCard'
import { MobileScrollDots } from './MobileScrollDots'

interface SpotlightBlockProps {
  data: SpotlightBlockData
}

/**
 * SpotlightBlock Component
 *
 * Displays a horizontal carousel of project spotlight items with navigation arrows.
 * Matches the Figma design with arrows positioned between title and cards.
 * Mobile: Single card view with scroll dots
 * Desktop: Multiple cards with navigation arrows
 */
export function SpotlightBlock({ data }: SpotlightBlockProps) {
  const { title, selectedSpotlights, showArrows, itemsPerView = 4 } = data
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const desktopScrollRef = React.useRef<HTMLDivElement>(null)
  const mobileScrollRef = React.useRef<HTMLDivElement>(null)
  const [mobileCurrentIndex, setMobileCurrentIndex] = React.useState(0)

  if (!selectedSpotlights || selectedSpotlights.length === 0) {
    return null
  }

  // Use spotlights in the order they were selected (relationship field maintains order)
  const totalItems = selectedSpotlights.length
  const maxIndex = Math.max(0, totalItems - itemsPerView)

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  // Track mobile scroll position for dots
  const checkMobileScroll = React.useCallback(() => {
    const mobileContainer = mobileScrollRef.current
    if (mobileContainer) {
      const mobileScrollLeft = mobileContainer.scrollLeft
      const mobileScrollWidth = mobileContainer.scrollWidth
      if (mobileScrollWidth > 0 && totalItems > 0) {
        const cardWidth = mobileScrollWidth / totalItems
        const newIndex = Math.round(mobileScrollLeft / cardWidth)
        // Clamp index to valid range [0, totalItems - 1]
        const clampedIndex = Math.max(0, Math.min(newIndex, totalItems - 1))
        setMobileCurrentIndex(clampedIndex)
      }
    }
  }, [totalItems])

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

  // Track mobile scroll
  React.useEffect(() => {
    const mobileContainer = mobileScrollRef.current
    if (mobileContainer) {
      mobileContainer.addEventListener('scroll', checkMobileScroll)
      checkMobileScroll() // Initial check

      return () => {
        mobileContainer.removeEventListener('scroll', checkMobileScroll)
      }
    }
  }, [checkMobileScroll])

  return (
    <section className="bg-white px-4 md:px-[30px] pt-[60px] md:pt-[100px] pb-0">
      <div className="w-full">
        {/* Title Layout */}
        {title && (
          <div className="flex items-center w-full mb-0">
            <div className="flex flex-col gap-[26px] items-start">
              <h2 className="heading-2 text-spoke-black whitespace-nowrap">
                {title}
              </h2>
            </div>
          </div>
        )}

        {/* Navigation Arrows - Desktop only, positioned between title and cards */}
        {showArrows && totalItems > itemsPerView && (
          <div className="hidden md:flex items-center justify-between px-0 py-[10px] w-full">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                'h-[15px] w-[101px] flex items-center justify-center shrink-0 relative',
                'transition-opacity',
                currentIndex === 0 && 'opacity-30 cursor-not-allowed'
              )}
              aria-label="Previous projects"
            >
              <Image
                src="/arrow-left.svg"
                alt="Previous"
                width={101}
                height={15}
                className="w-full h-full"
              />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className={cn(
                'h-[15px] w-[101px] flex items-center justify-center shrink-0 relative',
                'transition-opacity',
                currentIndex >= maxIndex && 'opacity-30 cursor-not-allowed'
              )}
              aria-label="Next projects"
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

        {/* Desktop Card Row */}
        <div
          ref={desktopScrollRef}
          className={cn(
            'hidden md:flex gap-[21px] w-full overflow-x-auto snap-x snap-mandatory',
            '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
          )}
        >
          {selectedSpotlights.map((item, index) => {
            const gapTotal = 21 * (itemsPerView - 1)
            const cardWidth = `calc((100% - ${gapTotal}px) / ${itemsPerView})`
            return (
              <div
                key={item.id || index}
                className="flex-shrink-0 snap-center"
                style={{ 
                  width: cardWidth,
                  minWidth: `min(${cardWidth}, 350px)`
                }}
              >
                <SpotlightCard
                  title={item.caption || item.image.alt || ''}
                  imageUrl={getMediaUrl(item.image.url)}
                  imageAlt={item.image.alt}
                  href={item.link}
                  titleSize="h4"
                />
              </div>
            )
          })}
        </div>

        {/* Mobile: Single card with scroll dots */}
        <div className="md:hidden flex flex-col gap-[41px] w-full">
          <div
            ref={mobileScrollRef}
            className="flex overflow-x-auto gap-0 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {selectedSpotlights.map((item, index) => (
              <div
                key={item.id || index}
                className="min-w-full snap-center shrink-0"
              >
                <SpotlightCard
                  title={item.caption || item.image.alt || ''}
                  imageUrl={getMediaUrl(item.image.url)}
                  imageAlt={item.image.alt}
                  href={item.link}
                  titleSize="h4"
                />
              </div>
            ))}
          </div>
          
          {/* Mobile Scroll Dots */}
          <MobileScrollDots
            currentIndex={mobileCurrentIndex}
            totalItems={totalItems}
          />
        </div>
      </div>
    </section>
  )
}

export default SpotlightBlock

