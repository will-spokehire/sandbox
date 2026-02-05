import { cn } from '~/lib/utils'
import { getMediaUrl } from '~/lib/payload-api'
import type { RichTextContentBlockData } from '~/lib/payload-api'

interface RichTextContentBlockProps {
  data: RichTextContentBlockData
}

/**
 * Serialize Lexical rich text to HTML with article-style styling
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
  return children
    .map((node) => serializeNode(node))
    .join('')
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
    value?: { url?: string; alt?: string }
  }

  // Text node
  if (typedNode.text !== undefined && typedNode.text !== null) {
    const textValue: string = typedNode.text
    let text = escapeHtml(textValue)
    
    // Apply formatting
    if (typedNode.format) {
      if (typedNode.format & 1) text = `<strong>${text}</strong>` // Bold
      if (typedNode.format & 2) text = `<em>${text}</em>` // Italic
      if (typedNode.format & 8) text = `<u>${text}</u>` // Underline
      if (typedNode.format & 4) text = `<s>${text}</s>` // Strikethrough
      if (typedNode.format & 16) text = `<code>${text}</code>` // Code
    }
    
    return text
  }

  const childrenHTML = typedNode.children ? serializeChildren(typedNode.children) : ''

  switch (typedNode.type) {
    case 'paragraph':
      return `<p class="body-large text-black tracking-[-0.22px]">${childrenHTML}</p>`
    
    case 'heading':
      const tag = typedNode.tag || 'h2'
      // Map heading tags to article typography classes
      const headingClasses: Record<string, string> = {
        h2: 'heading-2',
        h3: 'heading-3',
        h4: 'heading-4',
        h5: 'heading-5',
        h6: 'heading-6',
      }
      const headingClass = headingClasses[tag] || 'heading-2'
      return `<${tag} class="${headingClass} text-black">${childrenHTML}</${tag}>`
    
    case 'list':
      const isOrdered = typedNode.listType === 'number'
      const listTag = isOrdered ? 'ol' : 'ul'
      const listStyleClass = isOrdered ? 'list-decimal' : 'list-disc'
      return `<${listTag} class="${listStyleClass} pl-6 space-y-2 body-large text-black">${childrenHTML}</${listTag}>`
    
    case 'listitem':
      return `<li>${childrenHTML}</li>`
    
    case 'link':
      const target = typedNode.newTab ? ' target="_blank" rel="noopener noreferrer"' : ''
      return `<a href="${escapeHtml(typedNode.url || '')}" class="text-black underline hover:no-underline"${target}>${childrenHTML}</a>`
    
    case 'quote':
      return `<blockquote class="body-large text-black border-l-4 border-black pl-4 my-6">${childrenHTML}</blockquote>`
    
    case 'upload':
      if (typedNode.value?.url) {
        const url = typedNode.value.url
        if (!url) return ''
        const imageUrl = getMediaUrl(url)
        if (!imageUrl || imageUrl === '') return ''
        const altText = typedNode.value.alt || ''
        // Images break out of text column and are full-width on desktop
        return `<div class="my-8 md:my-12 -mx-4 md:-mx-[30px] w-[calc(100%+2rem)] md:w-[calc(100%+60px)]"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(altText)}" class="w-full h-[562px] md:h-[810px] object-cover object-center" /></div>`
      }
      return ''
    
    case 'horizontalrule':
      return '<hr class="my-8 border-black" />'
    
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
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}

/**
 * RichTextContentBlock Component
 *
 * Renders free-form rich text content from Payload's Lexical editor
 * with article-style typography and layout.
 * 
 * When a header is provided, renders a two-column layout (header left, content right).
 * When no header is provided, maintains backward-compatible right-aligned single-column layout.
 */
export function RichTextContentBlock({ data }: RichTextContentBlockProps) {
  const { header, headerType = 'h2', content } = data

  if (!content) {
    return null
  }

  const htmlContent = serializeLexicalToHTML(content)

  // Map headerType to heading tag and typography class
  const headingClasses: Record<string, string> = {
    h1: 'heading-1',
    h2: 'heading-2',
    h3: 'heading-3',
    h4: 'heading-4',
    h5: 'heading-5',
    h6: 'heading-6',
  }
  const headingClass = headingClasses[headerType] || 'heading-2'
  const headingLevel = headerType || 'h2'

  // Render header with appropriate heading tag
  const renderHeader = () => {
    const headerClassName = cn(
      headingClass,
      'text-black',
      'w-full md:w-[400px]',
      'shrink-0'
    )

    switch (headingLevel) {
      case 'h1':
        return <h1 className={headerClassName}>{header}</h1>
      case 'h2':
        return <h2 className={headerClassName}>{header}</h2>
      case 'h3':
        return <h3 className={headerClassName}>{header}</h3>
      case 'h4':
        return <h4 className={headerClassName}>{header}</h4>
      case 'h5':
        return <h5 className={headerClassName}>{header}</h5>
      case 'h6':
        return <h6 className={headerClassName}>{header}</h6>
      default:
        return <h2 className={headerClassName}>{header}</h2>
    }
  }

  // If header exists, render two-column layout
  if (header) {
    return (
      <section className="bg-white pt-[60px] md:pt-[100px] pb-0">
        <div className="container mx-auto ">
          <div className="flex flex-col md:flex-row items-start justify-between w-full gap-8 md:gap-12">
            {/* Header on left */}
            {renderHeader()}
            {/* Content on right */}
            <div
              className={cn(
                'flex flex-col gap-6 md:gap-[38px]',
                'w-full md:w-[658px]',
                'shrink-0',
                'text-black',
                'relative' // For images to break out
              )}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </div>
        </div>
      </section>
    )
  }

  // Backward compatibility: no header, render existing right-aligned layout
  return (
    <section className="bg-white pt-[60px] md:pt-[100px] pb-0">
      <div className="container mx-auto">
        <div className="flex items-start justify-end w-full">
          <div
            className={cn(
              'flex flex-col gap-6 md:gap-[38px]',
              'max-w-full md:max-w-[710px]',
              'text-black',
              'relative' // For images to break out
            )}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
    </section>
  )
}

export default RichTextContentBlock


