'use client'

import * as React from 'react'
import { cn } from '~/lib/utils'
import type { FAQSectionBlockData, FAQ } from '~/lib/payload-api'
import { getFAQsByCategory, getFeaturedFAQs } from '~/lib/payload-api'
import { ChevronDown } from 'lucide-react'

interface FAQSectionBlockProps {
  data: FAQSectionBlockData
}

interface FAQItemProps {
  faq: FAQ
  defaultExpanded?: boolean
}

/**
 * Individual FAQ Item with accordion functionality
 */
function FAQItem({ faq, defaultExpanded = false }: FAQItemProps) {
  const [isOpen, setIsOpen] = React.useState(defaultExpanded)

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between py-4 text-left hover:text-primary transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium pr-4">{faq.question}</span>
        <ChevronDown
          className={cn(
            'w-5 h-5 shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <div className="text-muted-foreground prose prose-sm max-w-none">
          {/* Render rich text content - simplified for now */}
          {typeof faq.answer === 'string' ? (
            <p>{faq.answer}</p>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: serializeLexical(faq.answer) }} />
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Simple Lexical rich text serializer
 * This is a basic implementation - can be expanded for more complex content
 */
function serializeLexical(content: unknown): string {
  if (!content || typeof content !== 'object') {
    return ''
  }

  const root = content as { root?: { children?: unknown[] } }
  if (!root.root?.children) {
    return ''
  }

  return root.root.children
    .map((node: unknown) => {
      const typedNode = node as { type?: string; children?: unknown[]; text?: string }
      if (typedNode.type === 'paragraph') {
        const text = typedNode.children
          ?.map((child: unknown) => {
            const textChild = child as { text?: string }
            return textChild.text || ''
          })
          .join('')
        return `<p>${text}</p>`
      }
      return ''
    })
    .join('')
}

/**
 * FAQSectionBlock Component
 *
 * Displays frequently asked questions in various layouts.
 */
export function FAQSectionBlock({ data }: FAQSectionBlockProps) {
  const {
    title,
    subtitle,
    filterBy,
    selectedFAQs,
    category,
    limit = 10,
    displayStyle,
    defaultExpanded,
  } = data
  const [faqs, setFaqs] = React.useState<FAQ[]>(selectedFAQs || [])
  const [isLoading, setIsLoading] = React.useState(filterBy !== 'manual')

  // Fetch FAQs based on filter type
  React.useEffect(() => {
    async function loadFAQs() {
      if (filterBy === 'manual') {
        setFaqs(selectedFAQs || [])
        return
      }

      setIsLoading(true)
      try {
        let fetchedFAQs: FAQ[] = []
        if (filterBy === 'category' && category) {
          fetchedFAQs = await getFAQsByCategory(category)
        } else if (filterBy === 'featured') {
          fetchedFAQs = await getFeaturedFAQs(limit)
        }
        setFaqs(fetchedFAQs)
      } catch (error) {
        console.error('Error loading FAQs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFAQs()
  }, [filterBy, category, limit, selectedFAQs])

  if (isLoading) {
    return (
      <section className="pt-[60px] pb-0">
        <div className="container mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="space-y-3 mt-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!faqs || faqs.length === 0) {
    return null
  }

  return (
    <section className="pt-[60px] pb-0 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        {/* Accordion Display */}
        {displayStyle === 'accordion' && (
          <div className="max-w-3xl mx-auto">
            {faqs.map((faq) => (
              <FAQItem key={faq.id} faq={faq} defaultExpanded={defaultExpanded} />
            ))}
          </div>
        )}

        {/* Two Column Display */}
        {displayStyle === 'two-column' && (
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div>
              {faqs.slice(0, Math.ceil(faqs.length / 2)).map((faq) => (
                <FAQItem key={faq.id} faq={faq} defaultExpanded={defaultExpanded} />
              ))}
            </div>
            <div>
              {faqs.slice(Math.ceil(faqs.length / 2)).map((faq) => (
                <FAQItem key={faq.id} faq={faq} defaultExpanded={defaultExpanded} />
              ))}
            </div>
          </div>
        )}

        {/* List Display */}
        {displayStyle === 'list' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq) => (
              <div key={faq.id} className="bg-card rounded-lg p-6 border">
                <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                <div className="text-muted-foreground prose prose-sm max-w-none">
                  {typeof faq.answer === 'string' ? (
                    <p>{faq.answer}</p>
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: serializeLexical(faq.answer) }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default FAQSectionBlock


