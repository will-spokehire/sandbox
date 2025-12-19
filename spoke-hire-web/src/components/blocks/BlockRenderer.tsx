import type { PageBlock } from '~/lib/payload-api'
import { HeroSectionBlock } from './HeroSectionBlock'
import { StatsBarBlock } from './StatsBarBlock'
import { ValuePropsBlock } from './ValuePropsBlock'
import { TestimonialsBlock } from './TestimonialsBlock'
import { FAQSectionBlock } from './FAQSectionBlock'
import { RichTextContentBlock } from './RichTextContentBlock'
import { CallToActionBlock } from './CallToActionBlock'
import { FeaturedVehiclesBlock } from './FeaturedVehiclesBlock'
import { ImageGalleryBlock } from './ImageGalleryBlock'
import { TwoColumnContentBlock } from './TwoColumnContentBlock'
import { SpacerBlock } from './SpacerBlock'
import { SpotlightBlock } from './SpotlightBlock'

interface BlockRendererProps {
  block: PageBlock
  index: number
}

/**
 * BlockRenderer Component
 *
 * Renders the appropriate block component based on the block type.
 * This is the main switch component that maps block data to React components.
 */
export function BlockRenderer({ block, index }: BlockRendererProps) {
  switch (block.blockType) {
    case 'hero-carousel':
      return <HeroSectionBlock key={index} data={block} />

    case 'stats-bar':
      return <StatsBarBlock key={index} data={block} />

    case 'value-props-section':
      return <ValuePropsBlock key={index} data={block} />

    case 'testimonials-section':
      return <TestimonialsBlock key={index} data={block} />

    case 'faq-section':
      return <FAQSectionBlock key={index} data={block} />

    case 'rich-text-content':
      return <RichTextContentBlock key={index} data={block} />

    case 'call-to-action-block':
      return <CallToActionBlock key={index} data={block} />

    case 'featured-vehicles':
      return <FeaturedVehiclesBlock key={index} data={block} />

    case 'image-gallery':
      return <ImageGalleryBlock key={index} data={block} />

    case 'two-column-content':
      return <TwoColumnContentBlock key={index} data={block} />

    case 'spacer':
      return <SpacerBlock key={index} data={block} />

    case 'project-spotlight':
      return <SpotlightBlock key={index} data={block} />

    default:
      // TypeScript exhaustive check
      const _exhaustiveCheck: never = block
      console.warn(`Unknown block type: ${(_exhaustiveCheck as PageBlock).blockType}`)
      return null
  }
}

export default BlockRenderer

