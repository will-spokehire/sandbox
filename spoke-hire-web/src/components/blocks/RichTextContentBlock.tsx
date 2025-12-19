import { cn } from '~/lib/utils'
import type { RichTextContentBlockData } from '~/lib/payload-api'

interface RichTextContentBlockProps {
  data: RichTextContentBlockData
}

/**
 * Serialize Lexical rich text to HTML
 * This is a comprehensive implementation for Payload's Lexical editor output
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
  if (typedNode.text !== undefined) {
    let text = escapeHtml(typedNode.text)
    
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
    
    case 'upload':
      if (typedNode.value?.url) {
        return `<img src="${escapeHtml(typedNode.value.url)}" alt="${escapeHtml(typedNode.value.alt || '')}" class="rounded-lg" />`
      }
      return ''
    
    case 'horizontalrule':
      return '<hr />'
    
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
 * RichTextContentBlock Component
 *
 * Renders free-form rich text content from Payload's Lexical editor.
 */
export function RichTextContentBlock({ data }: RichTextContentBlockProps) {
  const { content, maxWidth, backgroundColor } = data

  if (!content) {
    return null
  }

  const bgClasses = {
    white: 'bg-white',
    muted: 'bg-muted',
    accent: 'bg-accent',
  }

  const widthClasses = {
    narrow: 'max-w-2xl',
    default: 'max-w-4xl',
    wide: 'max-w-6xl',
    full: 'max-w-full',
  }

  const htmlContent = serializeLexicalToHTML(content)

  return (
    <section className={cn('py-12 md:py-16', bgClasses[backgroundColor])}>
      <div className="container mx-auto px-4">
        <div
          className={cn(
            'mx-auto prose prose-lg prose-slate dark:prose-invert',
            'prose-headings:font-bold prose-headings:tracking-tight',
            'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
            'prose-img:rounded-lg prose-img:shadow-md',
            widthClasses[maxWidth]
          )}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </section>
  )
}

export default RichTextContentBlock


