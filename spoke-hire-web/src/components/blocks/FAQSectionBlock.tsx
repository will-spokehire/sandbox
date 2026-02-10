'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '~/lib/utils'
import type { FAQSectionBlockData, FAQ } from '~/lib/payload-api'
import { Button } from '~/components/ui/button'
import { TYPOGRAPHY } from '~/lib/design-tokens'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'

interface FAQSectionBlockProps {
  data: FAQSectionBlockData
}

interface FAQItemProps {
  faq: FAQ
  defaultExpanded?: boolean
}

/**
 * Custom JSX converters for FAQ content
 * Simplified styling for FAQ answers
 */
const faqJsxConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return <p>{children}</p>
  },
  link: ({ node, nodesToJSX }) => {
    const linkNode = node
    const fields = linkNode.fields
    const url = fields?.url ?? ''
    const newTab = fields?.newTab
    const target = newTab ? '_blank' : undefined
    const rel = newTab ? 'noopener noreferrer' : undefined
    const children = nodesToJSX({ nodes: node.children })
    return (
      <a href={url} target={target} rel={rel} className="underline hover:no-underline">
        {children}
      </a>
    )
  },
  list: ({ node, nodesToJSX }) => {
    const isOrdered = node.listType === 'number'
    const children = nodesToJSX({ nodes: node.children })
    if (isOrdered) {
      return <ol className="pl-6 space-y-1 list-decimal">{children}</ol>
    }
    return <ul className="pl-6 space-y-1 list-disc">{children}</ul>
  },
  listitem: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return <li>{children}</li>
  },
})

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
 * Render rich text content using PayloadCMS RichText component
 */
function RichTextContent({ content }: { content: unknown }) {
  if (!content || typeof content !== 'object') {
    return null
  }

  return (
    <RichText
      data={content as SerializedEditorState}
      converters={faqJsxConverters}
      disableContainer
    />
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
          <div className={cn(TYPOGRAPHY.bodyLarge, 'text-spoke-black rich-text-content')}>
            {typeof faq.answer === 'string' ? (
              <p>{faq.answer}</p>
            ) : (
              <RichTextContent content={faq.answer} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
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
      <div >
        <div className="flex flex-col gap-[30px] md:gap-10 w-full">
          {/* Title Section */}
          {(title ?? subtitle) && (
            <div className="flex flex-col gap-[30px] md:gap-10 items-start justify-end w-full">
              {/* Title and Subtitle */}
              <div className="flex flex-col gap-[15px] md:gap-[10px] items-start w-full">
                {title && (
                  <h2 className={cn(TYPOGRAPHY.h2, 'text-spoke-black w-full')}>
                    {title.toUpperCase()}
                  </h2>
                )}
                {subtitle && (
                  <div className={cn(TYPOGRAPHY.bodyLarge, 'text-spoke-black w-full md:w-auto')}>
                    {typeof subtitle === 'string' ? (
                      subtitle.split('\n').map((line, i) => <p key={i}>{line}</p>)
                    ) : (
                      <RichTextContent content={subtitle} />
                    )}
                  </div>
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
