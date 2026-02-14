'use client'

import * as React from 'react'
import { cn } from '~/lib/utils'
import { TYPOGRAPHY } from '~/lib/design-tokens'

interface FAQAccordionItemProps {
  /** Question text */
  question: string
  /** Answer content (server-rendered children) */
  children: React.ReactNode
  /** Default expanded state */
  defaultExpanded?: boolean
}

/**
 * Plus icon component that transforms to minus when expanded
 * Uses accordian-icon.svg from public folder
 * 16px size matching Figma design
 */
function PlusIcon({ isOpen, className }: { isOpen: boolean; className?: string }) {
  return (
    <div className={cn('w-4 h-4 shrink-0 relative', className)} aria-hidden="true">
      <img
        src="/accordian-icon.svg"
        alt=""
        className={cn(
          'w-full h-full transition-opacity duration-200',
          isOpen && 'opacity-0'
        )}
      />
      {/* Minus icon when expanded - hide vertical line */}
      <svg
        className={cn(
          'absolute inset-0 w-full h-full transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="2" y1="8" x2="13" y2="8" stroke="currentColor" />
      </svg>
    </div>
  )
}

/**
 * FAQAccordionItem - Client Component
 * 
 * Handles only the accordion expand/collapse functionality.
 * The question and answer content are passed as props/children (server-rendered).
 * This component only manages the toggle state and animation.
 * 
 * IMPORTANT: The answer content is always in the DOM (for SEO),
 * just hidden via CSS/height animation.
 */
export function FAQAccordionItem({ 
  question,
  children, 
  defaultExpanded = false 
}: FAQAccordionItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultExpanded)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = React.useState<number | undefined>(
    defaultExpanded ? undefined : 0
  )

  React.useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0)
    }
  }, [isOpen])

  return (
    <div className="border-b border-white w-full">
      <button
        type="button"
        className="flex w-full items-center justify-between py-[6px] text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className={cn(TYPOGRAPHY.bodyLarge, 'text-spoke-black flex-1 min-w-0')}>
          {question}
        </span>
        <div className="shrink-0">
          <PlusIcon isOpen={isOpen} className="text-spoke-black" />
        </div>
      </button>
      <div
        className="overflow-hidden transition-[height] duration-300 ease-in-out"
        style={{ height: contentHeight }}
        aria-hidden={!isOpen}
      >
        <div ref={contentRef} className="pt-4 pb-0">
          <div className={cn(TYPOGRAPHY.bodyLarge, 'text-spoke-black rich-text-content')}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQAccordionItem
