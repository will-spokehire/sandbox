"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "~/lib/utils"

export interface VehicleCardProps {
  /** Vehicle year */
  year: number | string
  /** Vehicle make (e.g., "Ford") */
  make: string
  /** Vehicle model (e.g., "Mustang") */
  model: string
  /** Location text (e.g., "Los Angeles, CA") */
  location?: string
  /** Primary image URL */
  imageUrl: string
  /** Alt text for image */
  imageAlt?: string
  /** Link URL for the card */
  href?: string
  /** Additional CSS classes */
  className?: string
  /** Image aspect ratio */
  aspectRatio?: "4:3" | "16:9" | "1:1"
  /** Click handler (if not using href) */
  onClick?: () => void
}

/**
 * VehicleCard component matching the Figma design system
 *
 * Features:
 * - Clean, borderless design with white background
 * - 4:3 aspect ratio image container (default)
 * - Year/Make/Model in uppercase (Degular Medium)
 * - Location text below
 * - Hover state with subtle scale effect
 *
 * @example
 * <VehicleCard
 *   year={1967}
 *   make="Ford"
 *   model="Mustang GT500"
 *   location="Los Angeles, CA"
 *   imageUrl="/vehicles/mustang.jpg"
 *   href="/vehicles/123"
 * />
 */
export function VehicleCard({
  year,
  make,
  model,
  location,
  imageUrl,
  imageAlt,
  href,
  className,
  aspectRatio = "4:3",
  onClick,
}: VehicleCardProps) {
  const aspectRatioClass = {
    "4:3": "aspect-[4/3]",
    "16:9": "aspect-video",
    "1:1": "aspect-square",
  }[aspectRatio]

  const title = `${year} ${make} ${model}`
  const defaultAlt = imageAlt ?? title

  const CardContent = (
    <>
      {/* Image Container */}
      <div
        className={cn(
          "relative w-full overflow-hidden bg-spoke-grey",
          aspectRatioClass
        )}
      >
        <Image
          src={imageUrl}
          alt={defaultAlt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 pt-3">
        <h3 className="vehicle-card-title text-spoke-black">{title}</h3>
        {location && (
          <p className="vehicle-card-location text-spoke-black/70">{location}</p>
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

export default VehicleCard

