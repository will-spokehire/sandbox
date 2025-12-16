"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "~/lib/utils"

export interface SpotlightCardProps {
  /** Project/spotlight title */
  title: string
  /** Primary image URL */
  imageUrl: string
  /** Alt text for image */
  imageAlt?: string
  /** Link URL for the card */
  href?: string
  /** Additional CSS classes */
  className?: string
  /** Click handler (if not using href) */
  onClick?: () => void
  /** Optional subtitle or description */
  subtitle?: string
  /** Title size variant - 'h4' for 32px (Figma design), 'h5' for 24px (default) */
  titleSize?: 'h4' | 'h5'
}

/**
 * SpotlightCard component for project showcases
 *
 * Features:
 * - Portrait orientation image (tall)
 * - Title below image (Degular Medium, 24px)
 * - Optional subtitle
 * - Click/link support
 * - Hover state with subtle scale effect
 *
 * @example
 * <SpotlightCard
 *   title="The Crown"
 *   imageUrl="/projects/crown.jpg"
 *   href="/projects/the-crown"
 *   subtitle="Netflix Series"
 * />
 */
export function SpotlightCard({
  title,
  imageUrl,
  imageAlt,
  href,
  className,
  onClick,
  subtitle,
  titleSize = 'h5',
}: SpotlightCardProps) {
  const defaultAlt = imageAlt ?? title
  const titleClass = titleSize === 'h4' ? 'heading-4' : 'heading-5'

  const CardContent = (
    <>
      {/* Image Container - Portrait aspect ratio */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-spoke-grey">
        <Image
          src={imageUrl}
          alt={defaultAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 pt-3">
        <h3 className={cn(titleClass, "text-spoke-black")}>{title}</h3>
        {subtitle && (
          <p className="body-medium text-spoke-black/70">{subtitle}</p>
        )}
      </div>
    </>
  )

  const cardClasses = cn(
    "card-base group cursor-pointer",
    "transition-all duration-200",
    className
  )

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {CardContent}
      </Link>
    )
  }

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      {CardContent}
    </div>
  )
}

export default SpotlightCard

