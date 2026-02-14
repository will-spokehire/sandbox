import Image from 'next/image'
import { cn } from '~/lib/utils'
import type { ImageCarouselBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'
import { ImageCarouselClient } from './ImageCarouselClient'

interface ImageCarouselBlockProps {
  data: ImageCarouselBlockData
  /** Whether this block is a candidate for LCP (Largest Contentful Paint) optimization */
  isLCPCandidate?: boolean
}

/**
 * ImageCarouselBlock Component - SERVER COMPONENT
 *
 * Pure image carousel with auto-play functionality.
 * Supports separate mobile and desktop images.
 * No text overlays, navigation arrows, or dots - just images.
 * 
 * All images are server-rendered for SEO (crawlers see all images in DOM).
 * The ImageCarouselClient component handles only autoplay and visibility toggling.
 */
export function ImageCarouselBlock({ data, isLCPCandidate = false }: ImageCarouselBlockProps) {
  const { images, autoplay = true, autoplayDelay = 5 } = data

  if (!images || images.length === 0) {
    return null
  }

  const totalImages = images.length

  return (
    <section className="relative w-full overflow-hidden bg-white pt-[40px] pb-0">
      <div>
        <ImageCarouselClient 
          autoplay={autoplay} 
          autoplayDelay={autoplayDelay}
          imageCount={totalImages}
        >
          {/* All images are server-rendered - visible to crawlers */}
          {images.map((image, index) => {
            const desktopImage = image.desktopImage
            const mobileImage = image.mobileImage
            const hasMobileImage = !!mobileImage

            if (!desktopImage) return null

            return (
              <div
                key={image.id}
                data-slide={index}
                data-has-mobile={hasMobileImage ? 'true' : 'false'}
                className={cn(
                  'absolute inset-0',
                  index === 0 ? 'block' : 'hidden'
                )}
                role="group"
                aria-roledescription="slide"
                aria-label={`Image ${index + 1} of ${totalImages}`}
              >
                {/* Desktop Image */}
                <div data-image-type="desktop" className="relative block w-full h-full">
                  <Image
                    src={getMediaUrl(desktopImage.url)}
                    alt={image.alt || `Carousel image ${index + 1}`}
                    fill
                    className="object-cover object-center"
                    priority={index === 0}
                    fetchPriority={index === 0 ? 'high' : 'auto'}
                    sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1572px) calc(100vw - 60px), 1452px"
                  />
                </div>

                {/* Mobile Image (if exists) */}
                {mobileImage && (
                  <div data-image-type="mobile" className="relative hidden w-full h-full">
                    <Image
                      src={getMediaUrl(mobileImage.url)}
                      alt={image.alt || `Carousel image ${index + 1}`}
                      fill
                      className="object-cover object-center"
                      priority={index === 0}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      sizes="(max-width: 768px) calc(100vw - 32px), (max-width: 1572px) calc(100vw - 60px), 1452px"
                    />
                  </div>
                )}
              </div>
            )
          })}
        </ImageCarouselClient>
      </div>
    </section>
  )
}

export default ImageCarouselBlock

