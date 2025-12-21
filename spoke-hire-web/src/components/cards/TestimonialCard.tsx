"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "~/lib/utils"

export interface TestimonialCardProps {
  /** Star rating (0-5) */
  rating: number
  /** Testimonial quote text */
  quote: string
  /** Author name */
  authorName: string
  /** Author role/title (optional) */
  authorRole?: string
  /** Additional CSS classes */
  className?: string
}

/**
 * Star rating display component using star.svg
 * Matches Figma design: 116px total width for 5 stars
 * Shows filled stars up to the rating, unfilled stars are dimmed
 */
function StarRatingDisplay({
  rating,
  className,
}: {
  rating: number
  className?: string
}) {
  const fullStars = Math.floor(rating)
  const clampedRating = Math.max(0, Math.min(5, rating)) // Clamp between 0-5

  return (
    <div
      className={cn("flex items-center", className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
      style={{ width: '116px', height: '22.889px' }}
    >
      {Array.from({ length: 5 }, (_, i) => {
        const isFilled = i < fullStars
        return (
          <Image
            key={i}
            src="/star.svg"
            alt=""
            width={20}
            height={19}
            className="object-contain"
            style={{ 
              width: '23.2px', // 116px / 5 = 23.2px per star
              height: '22.889px',
              opacity: isFilled ? 1 : 0.3 // Dim unfilled stars
            }}
          />
        )
      })}
    </div>
  )
}

/**
 * TestimonialCard component matching the Figma design system
 *
 * Features:
 * - 5-star rating display
 * - Quote text in Degular Light
 * - Author name and optional role
 * - Clean, minimal design
 *
 * @example
 * <TestimonialCard
 *   rating={5}
 *   quote="Amazing experience! The vehicle was in perfect condition and the owner was incredibly helpful."
 *   authorName="John Smith"
 *   authorRole="Film Producer"
 * />
 */
export function TestimonialCard({
  rating,
  quote,
  authorName,
  authorRole,
  className,
}: TestimonialCardProps) {
  return (
    <article
      className={cn("flex flex-col gap-6 w-full", className)}
      aria-label={`Testimonial from ${authorName}`}
      style={{ maxWidth: '100%', minWidth: 0 }}
    >
      {/* Star Rating */}
      <StarRatingDisplay rating={rating} />

      {/* Quote - body-large-light: 22px desktop / 18px mobile, Degular Light, line-height 1.3, tracking -0.22px */}
      <blockquote 
        className="body-large-light text-spoke-black break-words whitespace-normal"
        style={{ width: '100%', maxWidth: '100%', minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word' }}
      >
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <footer className="flex flex-col gap-0 w-full" style={{ maxWidth: '100%', minWidth: 0 }}>
        {/* Author name - body-large: 22px, Degular Regular, line-height 1.3, tracking -0.22px */}
        <cite 
          className="body-large not-italic text-spoke-black break-words whitespace-normal"
          style={{ width: '100%', maxWidth: '100%', minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word' }}
        >
          {authorName}
        </cite>
        {/* Role/subtitle - label-text: 16px, Degular Regular, line-height 1.4, tracking -0.16px */}
        {authorRole && (
          <span 
            className="label-text text-spoke-black break-words whitespace-normal"
            style={{ width: '100%', maxWidth: '100%', minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {authorRole}
          </span>
        )}
      </footer>
    </article>
  )
}

export default TestimonialCard

