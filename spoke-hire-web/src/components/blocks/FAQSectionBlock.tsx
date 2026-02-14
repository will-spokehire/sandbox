import Link from 'next/link'
import { cn } from '~/lib/utils'
import type { FAQSectionBlockData } from '~/lib/payload-api'
import { Button } from '~/components/ui/button'
import { TYPOGRAPHY } from '~/lib/design-tokens'
import { RichText, type JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'
import { FAQAccordionItem } from './FAQAccordionItem'

interface FAQSectionBlockProps {
  data: FAQSectionBlockData
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
 * Render rich text content using PayloadCMS RichText component
 * Server-compatible - no client hooks
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
 * FAQSectionBlock Component - SERVER COMPONENT
 *
 * Displays frequently asked questions matching Figma design specifications.
 * Desktop: 64px title, 22px text, 40px gaps
 * Mobile: 42px title, 18px text, 30px gaps
 * 
 * All FAQ content (questions AND answers) is server-rendered for SEO.
 * Crawlers see all Q&A content in the DOM.
 * The FAQAccordionItem client component handles only the toggle animation.
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
      <div>
        <div className="flex flex-col gap-[30px] md:gap-10 w-full">
          {/* Title Section - Server Rendered */}
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

          {/* Accordion List - Server-rendered Q&A with client toggle */}
          <div className="flex flex-col gap-[14px] items-start w-full">
            {selectedFAQs.map((faq) => (
              <FAQAccordionItem 
                key={faq.id} 
                question={faq.question}
                defaultExpanded={defaultExpanded}
              >
                {/* Server-rendered answer content - visible to crawlers */}
                {typeof faq.answer === 'string' ? (
                  <p>{faq.answer}</p>
                ) : (
                  <RichTextContent content={faq.answer} />
                )}
              </FAQAccordionItem>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default FAQSectionBlock
