"use client"

import * as React from "react"
import { cn } from "~/lib/utils"

export interface AccordionDetailItem {
  /** Label for the detail (e.g., "Make") */
  label: string
  /** Value for the detail (e.g., "Ford") */
  value: string
}

export interface AccordionDetailsProps {
  /** Title of the accordion section */
  title: string
  /** Array of key-value detail items */
  items: AccordionDetailItem[]
  /** Whether the accordion is initially open */
  defaultOpen?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Chevron icon for accordion toggle
 */
function ChevronIcon({
  isOpen,
  className,
}: {
  isOpen: boolean
  className?: string
}) {
  return (
    <svg
      className={cn(
        "size-6 transition-transform duration-200",
        isOpen && "rotate-180",
        className
      )}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

/**
 * AccordionDetails component for displaying key-value pairs
 *
 * Features:
 * - Title with toggle icon
 * - Key-value pair list when expanded
 * - Label (Regular) + Value (Light) styling
 * - Smooth open/close animation
 *
 * @example
 * <AccordionDetails
 *   title="Vehicle Details"
 *   items={[
 *     { label: "Make", value: "Ford" },
 *     { label: "Model", value: "Mustang" },
 *     { label: "Year", value: "1967" },
 *   ]}
 *   defaultOpen
 * />
 */
export function AccordionDetails({
  title,
  items,
  defaultOpen = false,
  className,
}: AccordionDetailsProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = React.useState<number | undefined>(
    defaultOpen ? undefined : 0
  )

  React.useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen, items])

  const toggleAccordion = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className={cn("border-b border-spoke-black/20", className)}>
      {/* Header/Trigger */}
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left"
        onClick={toggleAccordion}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <span className="accordion-title text-spoke-black">{title}</span>
        <ChevronIcon isOpen={isOpen} className="text-spoke-black" />
      </button>

      {/* Content */}
      <div
        id={`accordion-content-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: contentHeight }}
        aria-hidden={!isOpen}
      >
        <div ref={contentRef} className="pb-4">
          <dl className="flex flex-col gap-3">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between gap-4">
                <dt className="accordion-detail-label text-spoke-black">
                  {item.label}
                </dt>
                <dd className="accordion-detail-value text-spoke-black text-right">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default AccordionDetails

