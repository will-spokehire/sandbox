'use client'

import * as React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '~/lib/utils'
import type { ImageGalleryBlockData } from '~/lib/payload-api'
import { getMediaUrl } from '~/lib/payload-api'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryBlockProps {
  data: ImageGalleryBlockData
}

/**
 * ImageGalleryBlock Component
 *
 * Displays an image gallery in various layouts with optional lightbox.
 */
export function ImageGalleryBlock({ data }: ImageGalleryBlockProps) {
  const { title, images, displayStyle, columns } = data
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const [lightboxIndex, setLightboxIndex] = React.useState(0)

  if (!images || images.length === 0) {
    return null
  }

  // Get column class based on columns value (handles both string and number)
  const getColumnClass = (cols: string | number) => {
    const colNum = String(cols)
    switch (colNum) {
      case '2': return 'grid-cols-1 md:grid-cols-2'
      case '3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case '4': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
      case '5': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const goToPrevious = () => {
    setLightboxIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setLightboxIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  // Handle keyboard navigation
  React.useEffect(() => {
    if (!lightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen])

  const renderImage = (item: (typeof images)[0], index: number) => {
    const imageElement = (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-muted group">
        <Image
          src={getMediaUrl(item.image.url)}
          alt={item.caption || item.image.alt || ''}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {item.caption && (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white text-sm">{item.caption}</p>
          </div>
        )}
      </div>
    )

    if (displayStyle === 'lightbox-grid') {
      return (
        <button
          key={index}
          onClick={() => openLightbox(index)}
          className="block w-full cursor-zoom-in"
        >
          {imageElement}
        </button>
      )
    }

    if (item.link) {
      return (
        <Link key={index} href={item.link} className="block">
          {imageElement}
        </Link>
      )
    }

    return <div key={index}>{imageElement}</div>
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{title}</h2>
        )}

        {/* Grid Display */}
        {(displayStyle === 'grid' || displayStyle === 'lightbox-grid') && (
          <div className={cn('grid gap-4', getColumnClass(columns))}>
            {images.map((item, index) => renderImage(item, index))}
          </div>
        )}

        {/* Masonry Display */}
        {displayStyle === 'masonry' && (
          <div className={cn('columns-1 gap-4', `md:columns-${columns}`)}>
            {images.map((item, index) => (
              <div key={index} className="break-inside-avoid mb-4">
                {item.link ? (
                  <Link href={item.link} className="block">
                    <div className="relative overflow-hidden rounded-lg bg-muted group">
                      <Image
                        src={getMediaUrl(item.image.url)}
                        alt={item.caption || item.image.alt || ''}
                        width={item.image.width || 800}
                        height={item.image.height || 600}
                        className="w-full h-auto transition-transform duration-300 group-hover:scale-105"
                      />
                      {item.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm">{item.caption}</p>
                        </div>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div className="relative overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={getMediaUrl(item.image.url)}
                      alt={item.caption || item.image.alt || ''}
                      width={item.image.width || 800}
                      height={item.image.height || 600}
                      className="w-full h-auto"
                    />
                    {item.caption && (
                      <p className="text-sm text-muted-foreground mt-2">{item.caption}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Carousel Display */}
        {displayStyle === 'carousel' && (
          <div className="flex overflow-x-auto gap-4 pb-4 snap-x snap-mandatory">
            {images.map((item, index) => (
              <div key={index} className="min-w-[280px] md:min-w-[400px] snap-center shrink-0">
                {item.link ? (
                  <Link href={item.link} className="block">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={getMediaUrl(item.image.url)}
                        alt={item.caption || item.image.alt || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {item.caption && (
                      <p className="text-sm text-muted-foreground mt-2">{item.caption}</p>
                    )}
                  </Link>
                ) : (
                  <>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                      <Image
                        src={getMediaUrl(item.image.url)}
                        alt={item.caption || item.image.alt || ''}
                        fill
                        className="object-cover"
                      />
                    </div>
                    {item.caption && (
                      <p className="text-sm text-muted-foreground mt-2">{item.caption}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 p-2 text-white hover:bg-white/20 rounded-full transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image */}
            <div
              className="relative max-w-[90vw] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={getMediaUrl(images[lightboxIndex].image.url)}
                alt={images[lightboxIndex].caption || images[lightboxIndex].image.alt || ''}
                width={images[lightboxIndex].image.width || 1200}
                height={images[lightboxIndex].image.height || 800}
                className="max-w-full max-h-[90vh] object-contain"
              />
              {images[lightboxIndex].caption && (
                <p className="text-white text-center mt-4">{images[lightboxIndex].caption}</p>
              )}
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default ImageGalleryBlock

