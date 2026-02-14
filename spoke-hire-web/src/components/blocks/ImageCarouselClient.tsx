'use client'

import * as React from 'react'

interface ImageCarouselClientProps {
  children: React.ReactNode
  /** Enable autoplay */
  autoplay?: boolean
  /** Autoplay delay in seconds */
  autoplayDelay?: number
  /** Total number of images */
  imageCount: number
}

/**
 * ImageCarouselClient - Client Component
 * 
 * Handles only the interactive carousel functionality:
 * - Autoplay timer to cycle through images
 * - Mobile viewport detection
 * - Toggles visibility of children via data attributes
 * 
 * The images are passed as children (server-rendered).
 * Each child should have data-slide="index" and data-mobile-image attributes.
 * This component only manages visibility, not the content.
 */
export function ImageCarouselClient({ 
  children, 
  autoplay = true, 
  autoplayDelay = 5,
  imageCount
}: ImageCarouselClientProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isMobile, setIsMobile] = React.useState(false)
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

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
    if (!autoplay || imageCount <= 1) return

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % imageCount)
    }, autoplayDelay * 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [autoplay, imageCount, autoplayDelay])

  // Update visibility of slides
  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const slides = container.querySelectorAll('[data-slide]')
    slides.forEach((slide) => {
      const slideIndex = parseInt(slide.getAttribute('data-slide') ?? '0', 10)
      const hasMobileImage = slide.getAttribute('data-has-mobile') === 'true'
      
      if (slideIndex === currentIndex) {
        // Show current slide
        slide.classList.remove('hidden')
        slide.classList.add('block')
        
        // Handle mobile/desktop image visibility within the slide
        const desktopImage = slide.querySelector('[data-image-type="desktop"]')
        const mobileImage = slide.querySelector('[data-image-type="mobile"]')
        
        if (isMobile && hasMobileImage && mobileImage) {
          desktopImage?.classList.add('hidden')
          desktopImage?.classList.remove('block')
          mobileImage?.classList.remove('hidden')
          mobileImage?.classList.add('block')
        } else {
          desktopImage?.classList.remove('hidden')
          desktopImage?.classList.add('block')
          mobileImage?.classList.add('hidden')
          mobileImage?.classList.remove('block')
        }
      } else {
        // Hide other slides
        slide.classList.add('hidden')
        slide.classList.remove('block')
      }
    })
  }, [currentIndex, isMobile])

  if (imageCount === 0) return null

  return (
    <div ref={containerRef} className="relative w-full h-[50vh] md:h-[60vh] lg:h-[813px]">
      {children}
    </div>
  )
}

export default ImageCarouselClient
