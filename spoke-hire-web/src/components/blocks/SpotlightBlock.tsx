import type { SpotlightBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'
import { SpotlightCard } from '~/components/cards/SpotlightCard'
import { SpotlightCarousel } from './SpotlightCarousel'

interface SpotlightBlockProps {
  data: SpotlightBlockData
}

/**
 * SpotlightBlock Component - SERVER COMPONENT
 *
 * Displays a horizontal carousel of project spotlight items with navigation arrows.
 * Matches the Figma design with arrows positioned between title and cards.
 * Mobile: Single card view with scroll dots
 * Desktop: Multiple cards with navigation arrows
 * 
 * All spotlight content is server-rendered for SEO.
 * The SpotlightCarousel client component handles only the interactive parts.
 */
export function SpotlightBlock({ data }: SpotlightBlockProps) {
  const { title, selectedSpotlights, showArrows, itemsPerView = 4 } = data

  if (!selectedSpotlights || selectedSpotlights.length === 0) {
    return null
  }

  const totalItems = selectedSpotlights.length

  return (
    <section className="bg-white pt-[60px] md:pt-[100px] pb-0">
      <div className="w-full">
        {/* Title Layout - Server Rendered */}
        {title && (
          <div className="flex items-center w-full mb-0">
            <div className="flex flex-col gap-[26px] items-start">
              <h2 className="heading-2 text-spoke-black whitespace-nowrap">
                {title}
              </h2>
            </div>
          </div>
        )}

        {/* Carousel with server-rendered cards */}
        <SpotlightCarousel
          itemCount={totalItems}
          showArrows={showArrows}
          itemsPerView={itemsPerView}
        >
          {/* Server-rendered spotlight cards */}
          {selectedSpotlights.map((item, index) => (
            <SpotlightCard
              key={item.id || index}
              title={item.caption || item.image.alt || ''}
              imageUrl={getMediaUrl(item.image.url)}
              imageAlt={item.image.alt}
              href={item.link}
              titleSize="h4"
            />
          ))}
        </SpotlightCarousel>
      </div>
    </section>
  )
}

export default SpotlightBlock

