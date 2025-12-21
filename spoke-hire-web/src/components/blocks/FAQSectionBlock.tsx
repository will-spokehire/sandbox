'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '~/lib/utils'
import type { FAQSectionBlockData, FAQ } from '~/lib/payload-api'
import { Button } from '~/components/ui/button'
import { LAYOUT_CONSTANTS, TYPOGRAPHY } from '~/lib/design-tokens'

interface FAQSectionBlockProps {
  data: FAQSectionBlockData
}

interface FAQItemProps {
  faq: FAQ
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
 * Individual FAQ Item with accordion functionality
 * Matches Figma design with proper typography and spacing
 */
function FAQItem({ faq, defaultExpanded = false }: FAQItemProps) {
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
          {faq.question}
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
          <div className={cn(TYPOGRAPHY.bodyLarge, 'text-spoke-black')}>
            {typeof faq.answer === 'string' ? (
              <p>{faq.answer}</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: serializeLexicalToHTML(faq.answer) }} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Serialize Lexical rich text to HTML for subtitle
 * Simplified version for subtitle rendering
 */
function serializeLexicalToHTML(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return ''
  }

  const root = content as { root?: { children?: unknown[] } }
  if (!root.root?.children) {
    return ''
  }

  return serializeChildren(root.root.children)
}

function serializeChildren(children: unknown[]): string {
  return children.map((node) => serializeNode(node)).join('')
}

function serializeNode(node: unknown): string {
  if (!node || typeof node !== 'object') {
    return ''
  }

  const typedNode = node as {
    type?: string
    tag?: string
    text?: string
    format?: number
    children?: unknown[]
    url?: string
    newTab?: boolean
  }

  // Text node
  if (typedNode.text !== undefined) {
    let text = escapeHtml(typedNode.text)
    
    // Apply formatting
    if (typedNode.format) {
      if (typedNode.format & 1) text = `<strong>${text}</strong>` // Bold
      if (typedNode.format & 2) text = `<em>${text}</em>` // Italic
      if (typedNode.format & 8) text = `<u>${text}</u>` // Underline
    }
    
    return text
  }

  const childrenHTML = typedNode.children ? serializeChildren(typedNode.children) : ''

  switch (typedNode.type) {
    case 'paragraph':
      return `<p>${childrenHTML}</p>`
    
    case 'link':
      const target = typedNode.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHtml(typedNode.url || '')}"${target}>${childrenHTML}</a>`
    
    default:
      return childrenHTML
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * FAQSectionBlock Component
 *
 * Displays frequently asked questions matching Figma design specifications.
 * Desktop: 64px title, 22px text, 40px gaps
 * Mobile: 42px title, 18px text, 30px gaps
 * Simplified to only support manual FAQ selection
 */
export function FAQSectionBlock({ data }: FAQSectionBlockProps) {
  const {
    title,
    subtitle,
    selectedFAQs,
    defaultExpanded,
  } = data

  if (!selectedFAQs || selectedFAQs.length === 0) {
    return null
  }

  return (
    <section className="bg-white pt-[60px] pb-0">
      <div className={cn(LAYOUT_CONSTANTS.contentPadding)}>
        <div className="flex flex-col gap-[30px] md:gap-10 w-full">
          {/* Title Section */}
          {(title || subtitle) && (
            <div className="flex flex-col gap-[30px] md:gap-10 items-start justify-end w-full">
              {/* Title and Subtitle */}
              <div className="flex flex-col gap-[15px] md:gap-[10px] items-start w-full">
                {title && (
                  <h2 className={cn(TYPOGRAPHY.h2, 'text-spoke-black w-full')}>
                    {title.toUpperCase()}
                  </h2>
                )}
                {subtitle && (
                  <div
                    className={cn(TYPOGRAPHY.bodyLarge, 'text-spoke-black w-full md:w-auto')}
                    dangerouslySetInnerHTML={{
                      __html: typeof subtitle === 'string' 
                        ? subtitle.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('')
                        : serializeLexicalToHTML(subtitle),
                    }}
                  />
                )}
              </div>
              {/* Button Group */}
              <div className="flex gap-[10px] items-start">
                <Button variant="outline" asChild>
                  <Link href="/contact">GET IN TOUCH</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Accordion List */}
          <div className="flex flex-col gap-[14px] items-start w-full">
            {selectedFAQs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} defaultExpanded={defaultExpanded} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQSectionBlock


