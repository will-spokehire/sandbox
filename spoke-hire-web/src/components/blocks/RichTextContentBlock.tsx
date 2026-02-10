import { cn } from '~/lib/utils'
import { getMediaUrl } from '~/lib/payload-api'
import type { RichTextContentBlockData } from '~/lib/payload-api'
import {
  RichText,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import type { DefaultNodeTypes } from '@payloadcms/richtext-lexical'

interface RichTextContentBlockProps {
  data: RichTextContentBlockData
}

/**
 * Custom JSX converters to apply project-specific styling
 * while using PayloadCMS's official Lexical serialization
 */
const jsxConverters: JSXConvertersFunction<DefaultNodeTypes> = ({
  defaultConverters,
}) => ({
  ...defaultConverters,
  paragraph: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    if (!children?.length) {
      return (
        <p className="body-large text-black tracking-[-0.22px]">
          <br />
        </p>
      )
    }
    return (
      <p className="body-large text-black tracking-[-0.22px]">{children}</p>
    )
  },
  heading: ({ node, nodesToJSX }) => {
    const headingClasses: Record<string, string> = {
      h1: 'heading-1',
      h2: 'heading-2',
      h3: 'heading-3',
      h4: 'heading-4',
      h5: 'heading-5',
      h6: 'heading-6',
    }
    const Tag = node.tag
    const headingClass = headingClasses[node.tag] ?? 'heading-2'
    const children = nodesToJSX({ nodes: node.children })
    return <Tag className={`${headingClass} text-black`}>{children}</Tag>
  },
  list: ({ node, nodesToJSX }) => {
    const isOrdered = node.listType === 'number'
    const children = nodesToJSX({ nodes: node.children })
    // Use node.tag to get the proper HTML element (ol/ul)
    const Tag = node.tag as 'ol' | 'ul'
    if (isOrdered) {
      return (
        <Tag className="pl-6 space-y-2 body-large text-black">{children}</Tag>
      )
    }
    return (
      <Tag className="list-disc pl-6 space-y-2 body-large text-black [&_ul]:list-[circle] [&_ul]:pl-4 [&_ul_ul]:list-[square]">
        {children}
      </Tag>
    )
  },
  listitem: ({ node, nodesToJSX }) => {
    // Check if this listitem contains a nested list
    const hasSubLists = node.children.some(
      (child: { type?: string }) => child.type === 'list'
    )
    const children = nodesToJSX({ nodes: node.children })
    // Hide the bullet/number for list items that contain nested lists
    return (
      <li style={hasSubLists ? { listStyleType: 'none' } : undefined}>
        {children}
      </li>
    )
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
      <a
        href={url}
        target={target}
        rel={rel}
        className="text-black underline hover:no-underline"
      >
        {children}
      </a>
    )
  },
  quote: ({ node, nodesToJSX }) => {
    const children = nodesToJSX({ nodes: node.children })
    return (
      <blockquote className="body-large text-black border-l-4 border-black pl-4 my-6">
        {children}
      </blockquote>
    )
  },
  upload: ({ node }) => {
    const uploadNode = node
    const value = uploadNode.value as { url?: string; alt?: string } | undefined
    if (value?.url) {
      const imageUrl = getMediaUrl(value.url)
      if (!imageUrl || imageUrl === '') return null
      const altText = value.alt ?? ''
      return (
        <div className="my-8 md:my-12 -mx-4 md:-mx-[30px] w-[calc(100%+2rem)] md:w-[calc(100%+60px)]">
          <img
            src={imageUrl}
            alt={altText}
            className="w-full h-[562px] md:h-[810px] object-cover object-center"
          />
        </div>
      )
    }
    return null
  },
  horizontalrule: () => <hr className="my-8 border-black" />,
})

/**
 * RichTextContentBlock Component
 *
 * Renders free-form rich text content from Payload's Lexical editor
 * with article-style typography and layout.
 *
 * Uses PayloadCMS's official RichText component for complete Lexical support.
 *
 * When a header is provided, renders a two-column layout (header left, content right).
 * When no header is provided, maintains backward-compatible right-aligned single-column layout.
 */
export function RichTextContentBlock({ data }: RichTextContentBlockProps) {
  const { header, headerType = 'h2', content } = data

  if (!content) {
    return null
  }

  // Map headerType to heading tag and typography class
  const headingClasses: Record<string, string> = {
    h1: 'heading-1',
    h2: 'heading-2',
    h3: 'heading-3',
    h4: 'heading-4',
    h5: 'heading-5',
    h6: 'heading-6',
  }
  const headingClass = headingClasses[headerType] ?? 'heading-2'
  const headingLevel = headerType ?? 'h2'

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

  // Rich text content wrapped in styled container
  const richTextContent = (
    <div
      className={cn(
        'rich-text-content',
        'flex flex-col gap-6 md:gap-[38px]',
        header ? 'w-full md:w-[658px]' : 'max-w-full md:max-w-[710px]',
        'shrink-0',
        'text-black',
        'relative' // For images to break out
      )}
    >
      <RichText
        data={content as SerializedEditorState}
        converters={jsxConverters}
        disableContainer
      />
    </div>
  )

  // If header exists, render two-column layout
  if (header) {
    return (
      <section className="bg-white pt-[60px] md:pt-[100px] pb-0">
        <div className="container mx-auto ">
          <div className="flex flex-col md:flex-row items-start justify-between w-full gap-8 md:gap-12">
            {/* Header on left */}
            {renderHeader()}
            {/* Content on right */}
            {richTextContent}
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
          {richTextContent}
        </div>
      </div>
    </section>
  )
}

export default RichTextContentBlock
