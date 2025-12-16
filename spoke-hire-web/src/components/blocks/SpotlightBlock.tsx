'use client'

import * as React from 'react'
import { cn } from '~/lib/utils'
import type { SpotlightBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'
import { SpotlightCard } from '~/components/cards/SpotlightCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface SpotlightBlockProps {
  data: SpotlightBlockData
}

/**
 * SpotlightBlock Component
 *
 * Displays a horizontal carousel of project spotlight items with navigation arrows.
 * Matches the Figma design with arrows positioned between title and cards.
 */
export function SpotlightBlock({ data }: SpotlightBlockProps) {
  const { title, images, showArrows, itemsPerView = 4 } = data
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)

  if (!images || images.length === 0) {
    return null
  }

  const totalItems = images.length
  const maxIndex = Math.max(0, totalItems - itemsPerView)

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  // Scroll container on index change
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current
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

  return (
    <section className="bg-white px-[30px] py-[41px]">
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

        {/* Navigation Arrows - Positioned between title and cards */}
        {showArrows && totalItems > itemsPerView && (
          <div className="flex items-center justify-between px-0 py-[20px] w-full">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className={cn(
                'h-[40px] w-[100px] relative shrink-0 flex items-center justify-center',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-opacity hover:opacity-80'
              )}
              aria-label="Previous projects"
            >
              <ChevronLeft className="w-6 h-6 text-spoke-black" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= maxIndex}
              className={cn(
                'h-[40px] w-[100px] relative shrink-0 flex items-center justify-center',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'transition-opacity hover:opacity-80'
              )}
              aria-label="Next projects"
            >
              <ChevronRight className="w-6 h-6 text-spoke-black" />
            </button>
          </div>
        )}

        {/* Card Row */}
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex gap-[21px] items-center w-full overflow-x-auto snap-x snap-mandatory',
            '[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
          )}
        >
          {images.map((item, index) => (
            <div
              key={item.image.id || index}
              className="flex-shrink-0 snap-center"
              style={{ minWidth: `calc((100% - ${21 * (itemsPerView - 1)}px) / ${itemsPerView})` }}
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
      </div>
    </section>
  )
}

export default SpotlightBlock

