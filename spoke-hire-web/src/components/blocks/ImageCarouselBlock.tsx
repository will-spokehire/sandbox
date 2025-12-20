'use client'

import * as React from 'react'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import type { ImageCarouselBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'

interface ImageCarouselBlockProps {
  data: ImageCarouselBlockData
}

/**
 * ImageCarouselBlock Component
 *
 * Pure image carousel with auto-play functionality.
 * Supports separate mobile and desktop images.
 * No text overlays, navigation arrows, or dots - just images.
 */
export function ImageCarouselBlock({ data }: ImageCarouselBlockProps) {
  const { images, autoplay = true, autoplayDelay = 5 } = data
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isMobile, setIsMobile] = React.useState(false)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)

  const totalImages = images?.length || 0

  // Detect mobile viewport
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768) // md breakpoint
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Handle autoplay
  React.useEffect(() => {
    if (!autoplay || totalImages <= 1) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalImages)
    }, autoplayDelay * 1000) // Convert seconds to milliseconds

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [autoplay, totalImages, autoplayDelay])

  if (!images || images.length === 0) {
    return null
  }

  const currentImage = images[currentIndex]

  // Determine which image to show (mobile or desktop)
  const imageToShow = isMobile && currentImage.mobileImage
    ? currentImage.mobileImage
    : currentImage.desktopImage

  if (!imageToShow) {
    return null
  }

  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[813px]">
        {images.map((image, index) => {
          const displayImage = isMobile && image.mobileImage
            ? image.mobileImage
            : image.desktopImage

          if (!displayImage) return null

          return (
            <div
              key={image.id}
              className={cn(
                'absolute inset-0 transition-opacity duration-700',
                index === currentIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
              role="group"
              aria-roledescription="slide"
              aria-label={`Image ${index + 1} of ${totalImages}`}
              aria-hidden={index !== currentIndex}
            >
              <Image
                src={getMediaUrl(displayImage.url)}
                alt={image.alt || `Carousel image ${index + 1}`}
                fill
                className="object-cover object-center"
                priority={index === 0}
                sizes="100vw"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default ImageCarouselBlock

