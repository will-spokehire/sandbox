import { cn } from '~/lib/utils'
import type { TestimonialsSectionBlockData } from '~/lib/payload-api'
import { TestimonialCard } from '~/components/cards/TestimonialCard'
import { LAYOUT_CONSTANTS } from '~/lib/design-tokens'
import { TestimonialsCarousel } from './TestimonialsCarousel'

interface TestimonialsBlockProps {
  data: TestimonialsSectionBlockData
}

/**
 * TestimonialsBlock Component - SERVER COMPONENT
 *
 * Displays customer testimonials matching Figma design:
 * - Desktop: 3 cards in a row with arrows under title
 * - Mobile: Single card with scroll dots
 * 
 * All testimonial content is server-rendered for SEO.
 * The TestimonialsCarousel client component handles only the interactive parts.
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
    <section className={cn("", LAYOUT_CONSTANTS.contentPadding)}>
      <TestimonialsCarousel
        itemCount={selectedTestimonials.length}
        title={title}
      >
        {/* Server-rendered testimonial cards */}
        {selectedTestimonials.map((testimonial) => (
          <TestimonialCard
            key={testimonial.id}
            quote={testimonial.quote}
            authorName={testimonial.author}
            authorRole={testimonial.role}
            rating={showRatings && testimonial.rating ? testimonial.rating : 5}
          />
        ))}
      </TestimonialsCarousel>
    </section>
  )
}

export default TestimonialsBlock
