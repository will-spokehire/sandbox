"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Background color variant */
  background?: "white" | "grey" | "black"
  /** Whether to use full width (no max-width constraint) */
  fullWidth?: boolean
  /** Padding size */
  padding?: "none" | "sm" | "md" | "lg" | "xl"
  /** HTML element to render as */
  as?: "section" | "div" | "article" | "aside"
  /** Additional CSS classes for the inner container */
  containerClassName?: string
}

/**
 * Section layout component with consistent spacing
 *
 * Features:
 * - Consistent max-width constraint (1512px)
 * - Responsive padding (64px desktop, 24px mobile)
 * - Background colour variants
 * - Semantic HTML element options
 *
 * @example
 * <Section background="grey" padding="lg">
 *   <h2>Featured Vehicles</h2>
 *   <VehicleGrid />
 * </Section>
 *
 * @example
 * <Section as="article" fullWidth background="black">
 *   <HeroContent />
 * </Section>
 */
export function Section({
  children,
  background = "white",
  fullWidth = false,
  padding = "lg",
  as: Component = "section",
  className,
  containerClassName,
  ...props
}: SectionProps) {
  const backgroundClasses = {
    white: "bg-spoke-white",
    grey: "bg-spoke-grey",
    black: "bg-spoke-black text-spoke-white",
  }[background]

  const paddingClasses = {
    none: "",
    sm: "py-4 md:py-6",
    md: "py-6 md:py-10",
    lg: "py-8 md:py-16",
    xl: "py-12 md:py-24",
  }[padding]

  return (
    <Component
      className={cn(backgroundClasses, paddingClasses, className)}
      {...props}
    >
      <div
        className={cn(
          "px-4 md:px-6 lg:px-16",
          !fullWidth && "mx-auto max-w-[1512px]",
          containerClassName
        )}
      >
        {children}
      </div>
    </Component>
  )
}

export default Section

