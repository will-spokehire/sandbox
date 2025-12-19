import { cn } from '~/lib/utils'
import type { TwoColumnContentBlockData } from '~/lib/payload-api'

interface TwoColumnContentBlockProps {
  data: TwoColumnContentBlockData
}

/**
 * Serialize Lexical rich text to HTML
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
    listType?: string
  }

  // Text node
  if (typedNode.text !== undefined) {
    let text = escapeHtml(typedNode.text)

    if (typedNode.format) {
      if (typedNode.format & 1) text = `<strong>${text}</strong>`
      if (typedNode.format & 2) text = `<em>${text}</em>`
      if (typedNode.format & 8) text = `<u>${text}</u>`
      if (typedNode.format & 4) text = `<s>${text}</s>`
      if (typedNode.format & 16) text = `<code>${text}</code>`
    }

    return text
  }

  const childrenHTML = typedNode.children ? serializeChildren(typedNode.children) : ''

  switch (typedNode.type) {
    case 'paragraph':
      return `<p>${childrenHTML}</p>`
    case 'heading':
      const tag = typedNode.tag || 'h2'
      return `<${tag}>${childrenHTML}</${tag}>`
    case 'list':
      const listTag = typedNode.listType === 'number' ? 'ol' : 'ul'
      return `<${listTag}>${childrenHTML}</${listTag}>`
    case 'listitem':
      return `<li>${childrenHTML}</li>`
    case 'link':
      const target = typedNode.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHtml(typedNode.url || '')}"${target}>${childrenHTML}</a>`
    case 'quote':
      return `<blockquote>${childrenHTML}</blockquote>`
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
 * TwoColumnContentBlock Component
 *
 * Displays side-by-side rich text content with configurable ratios.
 */
export function TwoColumnContentBlock({ data }: TwoColumnContentBlockProps) {
  const { leftColumn, rightColumn, columnRatio, reverseOnMobile, verticalAlignment } = data

  if (!leftColumn && !rightColumn) {
    return null
  }

  const ratioClasses = {
    '50-50': 'md:grid-cols-2',
    '60-40': 'md:grid-cols-[3fr_2fr]',
    '40-60': 'md:grid-cols-[2fr_3fr]',
    '70-30': 'md:grid-cols-[7fr_3fr]',
    '30-70': 'md:grid-cols-[3fr_7fr]',
  }

  const alignmentClasses = {
    top: 'items-start',
    center: 'items-center',
    bottom: 'items-end',
  }

  const leftHTML = serializeLexicalToHTML(leftColumn)
  const rightHTML = serializeLexicalToHTML(rightColumn)

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'grid gap-8 md:gap-12',
            ratioClasses[columnRatio],
            alignmentClasses[verticalAlignment]
          )}
        >
          {/* Left Column */}
          <div
            className={cn(
              'prose prose-lg prose-slate dark:prose-invert max-w-none',
              'prose-headings:font-bold prose-a:text-primary',
              reverseOnMobile && 'order-2 md:order-1'
            )}
            dangerouslySetInnerHTML={{ __html: leftHTML }}
          />

          {/* Right Column */}
          <div
            className={cn(
              'prose prose-lg prose-slate dark:prose-invert max-w-none',
              'prose-headings:font-bold prose-a:text-primary',
              reverseOnMobile && 'order-1 md:order-2'
            )}
            dangerouslySetInnerHTML={{ __html: rightHTML }}
          />
        </div>
      </div>
    </section>
  )
}

export default TwoColumnContentBlock


