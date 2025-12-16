"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "~/lib/utils"

export interface GalleryImage {
  /** Image source URL */
  src: string
  /** Alt text for the image */
  alt: string
}

export interface ImageGalleryProps {
  /** Array of images to display */
  images: GalleryImage[]
  /** Aspect ratio for the main image */
  aspectRatio?: "4:3" | "16:9" | "1:1"
  /** Additional CSS classes */
  className?: string
  /** Enable lightbox on click */
  enableLightbox?: boolean
  /** Maximum thumbnails to show */
  maxThumbnails?: number
}

/**
 * Close icon for lightbox
 */
function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

/**
 * Chevron icons for navigation
 */
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  )
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

/**
 * Lightbox component for fullscreen image viewing
 */
function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrevious,
  onNext,
}: {
  images: GalleryImage[]
  currentIndex: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}) {
  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") onPrevious()
      if (e.key === "ArrowRight") onNext()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose, onPrevious, onNext])

  const currentImage = images[currentIndex]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Close button */}
      <button
        type="button"
        className="absolute right-4 top-4 z-10 p-2 text-white hover:opacity-70 transition-opacity"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <CloseIcon className="size-8" />
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:opacity-70 transition-opacity"
          onClick={onPrevious}
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="size-10" />
        </button>
      )}

      {/* Image */}
      <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <Image
          src={currentImage.src}
          alt={currentImage.alt}
          fill
          className="object-contain"
          sizes="90vw"
          priority
        />
      </div>

      {/* Next button */}
      {images.length > 1 && (
        <button
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 text-white hover:opacity-70 transition-opacity"
          onClick={onNext}
          aria-label="Next image"
        >
          <ChevronRightIcon className="size-10" />
        </button>
      )}

      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

/**
 * ImageGallery component with main image and thumbnails
 *
 * Features:
 * - Main image display with configurable aspect ratio
 * - Thumbnail strip below
 * - Click to select thumbnail
 * - Optional lightbox for fullscreen viewing
 * - Keyboard navigation in lightbox
 *
 * @example
 * <ImageGallery
 *   images={[
 *     { src: "/image1.jpg", alt: "Front view" },
 *     { src: "/image2.jpg", alt: "Side view" },
 *     { src: "/image3.jpg", alt: "Interior" },
 *   ]}
 *   aspectRatio="4:3"
 *   enableLightbox
 * />
 */
export function ImageGallery({
  images,
  aspectRatio = "4:3",
  className,
  enableLightbox = true,
  maxThumbnails = 6,
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)

  const aspectRatioClass = {
    "4:3": "aspect-[4/3]",
    "16:9": "aspect-video",
    "1:1": "aspect-square",
  }[aspectRatio]

  const selectedImage = images[selectedIndex]
  const visibleThumbnails = images.slice(0, maxThumbnails)
  const hasMoreThumbnails = images.length > maxThumbnails

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  if (images.length === 0) {
    return (
      <div
        className={cn(
          "bg-spoke-grey flex items-center justify-center",
          aspectRatioClass,
          className
        )}
      >
        <span className="text-spoke-black/50 body-medium">No images</span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Main Image */}
      <div
        className={cn(
          "relative w-full overflow-hidden bg-spoke-grey",
          aspectRatioClass,
          enableLightbox && "cursor-pointer"
        )}
        onClick={() => enableLightbox && setLightboxOpen(true)}
        role={enableLightbox ? "button" : undefined}
        tabIndex={enableLightbox ? 0 : undefined}
        onKeyDown={
          enableLightbox
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setLightboxOpen(true)
                }
              }
            : undefined
        }
        aria-label={enableLightbox ? "Open image in lightbox" : undefined}
      >
        <Image
          src={selectedImage.src}
          alt={selectedImage.alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 66vw, 50vw"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {visibleThumbnails.map((image, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "relative shrink-0 w-20 h-16 overflow-hidden bg-spoke-grey",
                "transition-opacity duration-150",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-spoke-black",
                selectedIndex === index
                  ? "ring-2 ring-spoke-black"
                  : "opacity-70 hover:opacity-100"
              )}
              onClick={() => setSelectedIndex(index)}
              aria-label={`View ${image.alt}`}
              aria-current={selectedIndex === index ? "true" : undefined}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
          {hasMoreThumbnails && (
            <button
              type="button"
              className={cn(
                "relative shrink-0 w-20 h-16 bg-spoke-grey",
                "flex items-center justify-center",
                "text-spoke-black body-small font-medium",
                "hover:bg-spoke-grey-light transition-colors"
              )}
              onClick={() => enableLightbox && setLightboxOpen(true)}
              aria-label={`View all ${images.length} images`}
            >
              +{images.length - maxThumbnails}
            </button>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={selectedIndex}
          onClose={() => setLightboxOpen(false)}
          onPrevious={handlePrevious}
          onNext={handleNext}
        />
      )}
    </div>
  )
}

export default ImageGallery

