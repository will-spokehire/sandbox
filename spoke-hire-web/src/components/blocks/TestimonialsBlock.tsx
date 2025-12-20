'use client'

import * as React from 'react'
import { cn } from '~/lib/utils'
import type { TestimonialsSectionBlockData } from '~/lib/payload-api'
import { TestimonialCard } from '~/components/cards/TestimonialCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TestimonialsBlockProps {
  data: TestimonialsSectionBlockData
}

/**
 * TestimonialsBlock Component
 *
 * Displays customer testimonials in various layouts.
 */
export function TestimonialsBlock({ data }: TestimonialsBlockProps) {
  const {
    title,
    subtitle,
    selectedTestimonials,
    displayStyle,
    showRatings,
    showImages,
    itemsPerView = 3,
  } = data
  const [currentIndex, setCurrentIndex] = React.useState(0)

  if (!selectedTestimonials || selectedTestimonials.length === 0) {
    return null
  }

  const totalItems = selectedTestimonials.length
  const maxIndex = Math.max(0, totalItems - itemsPerView)

  const goToPrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1))
  }

  return (
    <section className="pt-[60px] pb-0 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        {/* Carousel Display */}
        {displayStyle === 'carousel' && (
          <div className="relative">
            {/* Navigation Buttons */}
            {totalItems > itemsPerView && (
              <>
                <button
                  onClick={goToPrevious}
                  disabled={currentIndex === 0}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background shadow-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  aria-label="Previous testimonials"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  disabled={currentIndex >= maxIndex}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background shadow-md border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
                  aria-label="Next testimonials"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Carousel Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
                }}
              >
                {selectedTestimonials.map((testimonial) => (
                  <div
                    key={testimonial.id}
                    className="px-3"
                    style={{ flex: `0 0 ${100 / itemsPerView}%` }}
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
          </div>
        )}

        {/* Grid Display */}
        {displayStyle === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {selectedTestimonials.map((testimonial) => (
              <TestimonialCard
                key={testimonial.id}
                quote={testimonial.quote}
                authorName={testimonial.author}
                authorRole={testimonial.role}
                rating={showRatings && testimonial.rating ? testimonial.rating : 5}
              />
            ))}
          </div>
        )}

        {/* Masonry Display */}
        {displayStyle === 'masonry' && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {selectedTestimonials.map((testimonial) => (
              <div key={testimonial.id} className="break-inside-avoid">
                <TestimonialCard
                  quote={testimonial.quote}
                  authorName={testimonial.author}
                  authorRole={testimonial.role}
                  rating={showRatings && testimonial.rating ? testimonial.rating : 5}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default TestimonialsBlock

