"use client"

import * as React from "react"
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
 * Star icon component
 */
function StarIcon({
  filled,
  className,
}: {
  filled: boolean
  className?: string
}) {
  return (
    <svg
      className={cn("size-5", className)}
      viewBox="0 0 20 20"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  )
}

/**
 * Star rating display component
 */
function StarRatingDisplay({
  rating,
  className,
}: {
  rating: number
  className?: string
}) {
  const fullStars = Math.floor(rating)
  const hasPartial = rating % 1 !== 0

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          filled={i < fullStars || (i === fullStars && hasPartial)}
          className="text-spoke-black"
        />
      ))}
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
      className={cn("flex flex-col gap-4", className)}
      aria-label={`Testimonial from ${authorName}`}
    >
      {/* Star Rating */}
      <StarRatingDisplay rating={rating} />

      {/* Quote */}
      <blockquote className="testimonial-quote text-spoke-black">
        &ldquo;{quote}&rdquo;
      </blockquote>

      {/* Author */}
      <footer className="flex flex-col gap-0.5">
        <cite className="testimonial-author not-italic text-spoke-black">
          {authorName}
        </cite>
        {authorRole && (
          <span className="body-medium text-spoke-black/70">{authorRole}</span>
        )}
      </footer>
    </article>
  )
}

export default TestimonialCard

