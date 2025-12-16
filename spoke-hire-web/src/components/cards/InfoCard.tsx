"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface InfoCardProps {
  /** Icon element to display at top */
  icon: React.ReactNode
  /** Card title */
  title: string
  /** Card description */
  description: string
  /** Additional CSS classes */
  className?: string
  /** Optional link URL */
  href?: string
  /** Alignment of content */
  align?: "left" | "center"
}

/**
 * InfoCard component for feature/benefit displays
 *
 * Features:
 * - Icon at top
 * - Title (H3 style, uppercase)
 * - Description text
 * - Desktop/mobile responsive variants
 * - Optional link wrapper
 *
 * @example
 * <InfoCard
 *   icon={<CarIcon className="size-12" />}
 *   title="Wide Selection"
 *   description="Access to over 10,000 classic and modern vehicles for your production needs."
 * />
 */
export function InfoCard({
  icon,
  title,
  description,
  className,
  href,
  align = "left",
}: InfoCardProps) {
  const alignmentClasses = {
    left: "items-start text-left",
    center: "items-center text-center",
  }[align]

  const Content = (
    <div
      className={cn(
        "flex flex-col gap-4",
        alignmentClasses,
        className
      )}
    >
      {/* Icon */}
      <div className="text-spoke-black">{icon}</div>

      {/* Title */}
      <h3 className="info-card-title text-spoke-black">{title}</h3>

      {/* Description */}
      <p className="info-card-description text-spoke-black/80">{description}</p>
    </div>
  )

  if (href) {
    return (
      <a
        href={href}
        className="group block transition-opacity hover:opacity-80"
      >
        {Content}
      </a>
    )
  }

  return Content
}

export default InfoCard

