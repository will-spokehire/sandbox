'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '~/lib/utils'
import { CarouselDots } from '~/components/ui/carousel-dots'
import { Button } from '~/components/ui/button'
import type { HeroCarouselBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface HeroCarouselBlockProps {
  data: HeroCarouselBlockData
}

/**
 * HeroCarouselBlock Component
 *
 * Displays a rotating hero section with slides from the hero-slides collection.
 * Features autoplay, navigation arrows, and dots.
 */
export function HeroCarouselBlock({ data }: HeroCarouselBlockProps) {
  const { slides, autoplay, autoplayDelay = 5000, showArrows, showDots } = data
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(autoplay)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  const totalSlides = slides?.length || 0

  // Handle autoplay
  React.useEffect(() => {
    if (!isAutoPlaying || totalSlides <= 1) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides)
    }, autoplayDelay)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isAutoPlaying, totalSlides, autoplayDelay])

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    // Reset autoplay timer on manual navigation
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    if (isAutoPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides)
      }, autoplayDelay)
    }
  }

  const goToPrevious = () => {
    goToSlide(currentIndex === 0 ? totalSlides - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    goToSlide((currentIndex + 1) % totalSlides)
  }

  // Pause autoplay on hover
  const handleMouseEnter = () => setIsAutoPlaying(false)
  const handleMouseLeave = () => setIsAutoPlaying(autoplay)

  if (!slides || slides.length === 0) {
    return null
  }

  const currentSlide = slides[currentIndex]

  return (
    <section
      className="relative w-full overflow-hidden bg-spoke-black"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      aria-roledescription="carousel"
      aria-label="Hero carousel"
    >
      {/* Slides Container */}
      <div className="relative aspect-[16/9] md:aspect-[21/9] lg:aspect-[3/1]">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              'absolute inset-0 transition-opacity duration-700',
              index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${totalSlides}`}
            aria-hidden={index !== currentIndex}
          >
            {/* Background Image */}
            {slide.image && (
              <Image
                src={getMediaUrl(slide.image.url)}
                alt={slide.image.alt || slide.heading || ''}
                fill
                className="object-cover"
                priority={index === 0}
                sizes="100vw"
              />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Content */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="container mx-auto px-4 text-center">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-4xl mx-auto">
                  {slide.heading}
                </h1>
                {slide.subheading && (
                  <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                    {slide.subheading}
                  </p>
                )}
                {slide.ctaText && slide.ctaLink && (
                  <Button asChild size="lg" className="text-lg px-8">
                    <Link href={slide.ctaLink}>{slide.ctaText}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {showArrows && totalSlides > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Navigation Dots */}
      {showDots && totalSlides > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
          <CarouselDots
            total={totalSlides}
            current={currentIndex}
            onDotClick={goToSlide}
            className="[&_button]:bg-white"
          />
        </div>
      )}
    </section>
  )
}

export default HeroCarouselBlock

