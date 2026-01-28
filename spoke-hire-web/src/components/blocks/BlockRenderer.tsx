import * as React from 'react'
import type { PageBlock } from '~/lib/payload-api'
import { StatsBarBlock } from './StatsBarBlock'
import { ValuePropsBlock } from './ValuePropsBlock'
import { TestimonialsBlock } from './TestimonialsBlock'
import { FAQSectionBlock } from './FAQSectionBlock'
import { RichTextContentBlock } from './RichTextContentBlock'
import { CallToActionBlock } from './CallToActionBlock'
import { FeaturedVehiclesBlock } from './FeaturedVehiclesBlock'
import { ImageCarouselBlock } from './ImageCarouselBlock'
import { SpacerBlock } from './SpacerBlock'
import { SpotlightBlock } from './SpotlightBlock'
import { NumberedListBlock } from './NumberedListBlock'

interface BlockRendererProps {
  block: PageBlock
  index: number
}

/**
 * BlockRenderer Component
 *
 * Renders the appropriate block component based on the block type.
 * This is the main switch component that maps block data to React components.
 * Handles mobile visibility using CSS (hideOnMobile field).
 * Uses Tailwind's `hidden sm:block` to hide on mobile (< 640px) and show on desktop (>= 640px).
 */
export function BlockRenderer({ block, index }: BlockRendererProps) {
  // Render the block content based on type
  let blockContent: React.ReactNode

  switch (block.blockType) {
    case 'stats-bar':
      blockContent = <StatsBarBlock key={index} data={block} />
      break

    case 'value-props-section':
      blockContent = <ValuePropsBlock key={index} data={block} />
      break

    case 'testimonials-section':
      blockContent = <TestimonialsBlock key={index} data={block} />
      break

    case 'faq-section':
      blockContent = <FAQSectionBlock key={index} data={block} />
      break

    case 'rich-text-content':
      blockContent = <RichTextContentBlock key={index} data={block} />
      break

    case 'call-to-action-block':
      blockContent = <CallToActionBlock key={index} data={block} />
      break

    case 'featured-vehicles':
      blockContent = <FeaturedVehiclesBlock key={index} data={block} />
      break

    case 'image-carousel':
      blockContent = <ImageCarouselBlock key={index} data={block} />
      break

    case 'spacer':
      blockContent = <SpacerBlock key={index} data={block} />
      break

    case 'project-spotlight':
      blockContent = <SpotlightBlock key={index} data={block} />
      break

    case 'numbered-list':
      blockContent = <NumberedListBlock key={index} data={block} />
      break

    default:
      // TypeScript exhaustive check
      const _exhaustiveCheck: never = block
      console.warn(`Unknown block type: ${(_exhaustiveCheck as PageBlock).blockType}`)
      return null
  }

  // If hideOnMobile is true, wrap in a div with CSS classes to hide on mobile
  // hidden = hide by default (mobile < 640px)
  // sm:block = show as block on sm breakpoint and up (>= 640px)
  if (block.hideOnMobile) {
    return <div className="hidden sm:block">{blockContent}</div>
  }

  return blockContent
}

export default BlockRenderer

