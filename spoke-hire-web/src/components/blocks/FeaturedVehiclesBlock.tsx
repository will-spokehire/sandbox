'use client'

import * as React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import type { FeaturedVehiclesBlockData } from '~/lib/payload-api'
import { Button } from '~/components/ui/button'
import { PublicVehicleCard } from '~/app/vehicles/_components/PublicVehicleCard'
import { MobileCarousel } from '~/components/ui/mobile-carousel'
import { LAYOUT_CONSTANTS } from '~/lib/design-tokens'
import { api } from '~/trpc/react'

interface FeaturedVehiclesBlockProps {
  data: FeaturedVehiclesBlockData
}

// Vehicle type from API response (matches PublicVehicleCard interface)
interface Vehicle {
  id: string
  name: string
  year: string
  make: {
    name: string
  }
  model: {
    name: string
  }
  media: Array<{
    publishedUrl: string | null
    originalUrl: string
  }>
  collections?: Array<{
    id: string
    name: string
  }>
  owner: {
    city: string | null
    county: string | null
    country: {
      name: string
    } | null
  }
}

/**
 * FeaturedVehiclesBlock Component
 *
 * Displays featured vehicles in carousel format.
 * Supports two selection types:
 * - 'manual': Select specific vehicles by entering their IDs
 * - 'latest': Show the most recently added vehicles
 */
export function FeaturedVehiclesBlock({ data }: FeaturedVehiclesBlockProps) {
  const {
    title,
    subtitle,
    selectionType,
    vehicleIds,
    limit = 6,
    showMobileButton = true,
  } = data

  const utils = api.useUtils()
  const [manualVehicles, setManualVehicles] = React.useState<Vehicle[]>([])
  const [isLoadingManual, setIsLoadingManual] = React.useState(false)

  // Fetch vehicles for manual selection (by IDs)
  const manualVehicleIds = React.useMemo(
    () => vehicleIds?.map((v) => v.vehicleId).filter(Boolean) ?? [],
    [vehicleIds]
  )

  React.useEffect(() => {
    async function fetchManualVehicles() {
      if (selectionType !== 'manual' || manualVehicleIds.length === 0) {
        setManualVehicles([])
        return
      }

      setIsLoadingManual(true)
      try {
        // Fetch all vehicles in parallel
        const vehiclePromises = manualVehicleIds.map((id) =>
          utils.publicVehicle.getById.fetch({ id }).catch(() => null)
        )
        const results = await Promise.all(vehiclePromises)
        const validVehicles = results.filter(
          (v): v is NonNullable<typeof v> => v !== null && v !== undefined
        ) as Vehicle[]
        setManualVehicles(validVehicles)
      } catch (error) {
        console.error('Error fetching manual vehicles:', error)
        setManualVehicles([])
      } finally {
        setIsLoadingManual(false)
      }
    }

    fetchManualVehicles()
  }, [selectionType, manualVehicleIds, utils])

  // Fetch vehicles for latest selection
  const latestVehiclesQuery = api.publicVehicle.list.useQuery(
    {
      limit: limit ?? 6,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    {
      enabled: selectionType === 'latest',
    }
  )

  // Determine which data to use based on selection type
  const vehicles = React.useMemo(() => {
    if (selectionType === 'manual') {
      return manualVehicles
    } else if (selectionType === 'latest') {
      return latestVehiclesQuery.data?.vehicles ?? []
    }
    return []
  }, [selectionType, manualVehicles, latestVehiclesQuery.data])

  const isLoading =
    (selectionType === 'manual' && isLoadingManual) ||
    (selectionType === 'latest' && latestVehiclesQuery.isLoading)

  if (isLoading) {
    return (
      <section className="bg-white pt-[60px] pb-0">
        <div className="max-w-[1448px] mx-auto w-full">
          <div className="animate-pulse">
            <div className="h-16 bg-muted rounded w-1/3 mb-4" />
            <div className="h-6 bg-muted rounded w-1/2 mb-8" />
            <div className="flex gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[240px] bg-muted rounded flex-shrink-0" style={{ width: 'calc((100% - 63px) / 4)' }} />
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Show placeholder if no vehicles
  if (vehicles.length === 0) {
    return (
      <section className="bg-white pt-[60px] pb-0">
        <div className="max-w-[1448px] mx-auto w-full flex flex-col gap-5 items-center">
          {/* Header */}
          {(title || subtitle) && (
            <div className="w-full flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-0">
              <div className="flex flex-col gap-3 md:gap-[12px]">
                {title && (
                  <h2 className="heading-2 text-spoke-black">
                    {title.toUpperCase()}
                  </h2>
                )}
                {subtitle && (
                  <p className="body-large text-spoke-black md:block hidden">
                    {subtitle}
                  </p>
                )}
                <p className="body-large text-spoke-black md:hidden">
                  Check out the latest additions to our roster.
                </p>
              </div>
              <div className="hidden md:block">
                <Button asChild variant="outline">
                  <Link href="/vehicles">See all vehicles</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Placeholder */}
          <div className="text-center py-12 w-full">
            <p className="body-medium text-spoke-black mb-4">
              Featured vehicles will be displayed here once configured.
            </p>
            <Button asChild variant="outline">
              <Link href="/vehicles">Browse All Vehicles</Link>
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={cn("bg-white pt-[60px] pb-0", LAYOUT_CONSTANTS.contentPadding)}>
      <div className=" mx-auto w-full flex flex-col gap-5 items-center">
        {/* Header - Left-aligned title with right-aligned button (desktop) */}
        {(title || subtitle) && (
          <div className="w-full flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-0">
            {/* Title Section */}
            <div className="flex flex-col gap-3 md:gap-[12px]">
              {title && (
                <h2 className="heading-2 text-spoke-black">
                  {title.toUpperCase()}
                </h2>
              )}
              {subtitle && (
                <p className="body-large text-spoke-black">
                  {subtitle}
                </p>
              )}
            </div>

            {/* See All Vehicles Button - Desktop only */}
            <div className="hidden md:block">
              <Button asChild variant="outline">
                <Link href="/vehicles">See all vehicles</Link>
              </Button>
            </div>
          </div>
        )}

        {/* Carousel Display */}
        <CarouselDisplay vehicles={vehicles} />

        {/* Mobile Show All Button */}
        {showMobileButton && (
          <div className="md:hidden w-full flex justify-center pt-[32px] pb-[19px]">
            <Button asChild variant="default">
              <Link href="/vehicles">See all vehicles</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}

/**
 * Carousel Display Component with Navigation Arrows
 * Updated to match Figma design with arrows above the carousel
 */
function CarouselDisplay({ vehicles }: { vehicles: Vehicle[] }) {
  const desktopCarouselRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)
  const [needsScroll, setNeedsScroll] = React.useState(false)

  const checkScrollability = React.useCallback(() => {
    // Check desktop carousel for arrow states
    const desktopContainer = desktopCarouselRef.current
    
    if (desktopContainer) {
      const computedStyle = window.getComputedStyle(desktopContainer)
      const isVisible = computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden'
      
      if (isVisible && desktopContainer.scrollWidth > 0) {
        const desktopScrollLeft = desktopContainer.scrollLeft
        const desktopScrollWidth = desktopContainer.scrollWidth
        const desktopClientWidth = desktopContainer.clientWidth
        
        const scrollThreshold = 5
        const canScroll = desktopScrollWidth > desktopClientWidth + scrollThreshold
        
        setNeedsScroll(canScroll)
        
        if (canScroll) {
          const canScrollLeftValue = desktopScrollLeft > scrollThreshold
          const maxScroll = desktopScrollWidth - desktopClientWidth
          const canScrollRightValue = desktopScrollLeft < maxScroll - scrollThreshold
          
          setCanScrollLeft(canScrollLeftValue)
          setCanScrollRight(canScrollRightValue)
        } else {
          setCanScrollLeft(false)
          setCanScrollRight(false)
        }
      }
    }
  }, [])

  React.useEffect(() => {
    // Observe desktop carousel with ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure layout is stable
      setTimeout(() => {
        checkScrollability()
      }, 50)
    })

    if (desktopCarouselRef.current) {
      resizeObserver.observe(desktopCarouselRef.current)
    }
    
    const desktopCarousel = desktopCarouselRef.current

    // Also check after initial render
    const checkAfterLayout = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          checkScrollability()
        }, 150)
      })
    }

    checkAfterLayout()

    if (desktopCarousel) {
      desktopCarousel.addEventListener('scroll', checkScrollability)
    }
    window.addEventListener('resize', checkAfterLayout)

    // Also check when images load (they might affect card width)
    const allImages = desktopCarousel?.querySelectorAll('img') ?? []
    allImages.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', checkScrollability, { once: true })
      }
    })

    return () => {
      resizeObserver.disconnect()
      if (desktopCarousel) {
        desktopCarousel.removeEventListener('scroll', checkScrollability)
      }
      window.removeEventListener('resize', checkAfterLayout)
    }
  }, [checkScrollability, vehicles])

  const scrollLeft = () => {
    const container = desktopCarouselRef.current
    if (container) {
      // Scroll by one card width + gap (21px)
      const firstCard = container.querySelector('[data-vehicle-card]') as HTMLElement
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth
        const gap = 21
        container.scrollBy({ left: -(cardWidth + gap), behavior: 'smooth' })
      } else {
        // Fallback: scroll by approximate card width
        container.scrollBy({ left: -320, behavior: 'smooth' })
      }
    }
  }

  const scrollRight = () => {
    const container = desktopCarouselRef.current
    if (container) {
      // Scroll by one card width + gap (21px)
      const firstCard = container.querySelector('[data-vehicle-card]') as HTMLElement
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth
        const gap = 21
        container.scrollBy({ left: cardWidth + gap, behavior: 'smooth' })
      } else {
        // Fallback: scroll by approximate card width
        container.scrollBy({ left: 320, behavior: 'smooth' })
      }
    }
  }

  if (vehicles.length === 0) return null

  return (
    <div className="w-full flex flex-col gap-[10px]">
      {/* Desktop: Arrows above carousel */}
      {needsScroll && (
      <div className="hidden md:flex items-center justify-between w-full px-0 py-[10px]">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          disabled={!canScrollLeft}
          className={cn(
            "h-[15px] w-[101px] flex items-center justify-center shrink-0 relative",
            "transition-opacity",
            !canScrollLeft && "opacity-30 cursor-not-allowed"
          )}
          aria-label="Scroll left"
        >
          <Image
            src="/arrow-left.svg"
            alt="Previous"
            width={101}
            height={15}
            className="w-full h-full"
          />
        </button>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className={cn(
            "h-[15px] w-[101px] flex items-center justify-center shrink-0 relative",
            "transition-opacity",
            !canScrollRight && "opacity-30"
          )}
          aria-label="Scroll right"
        >
          <Image
            src="/arrow-right.svg"
            alt="Next"
            width={101}
            height={15}
            className="w-full h-full"
          />
        </button>
      </div>
      )}

      {/* Carousel Container */}
      <div className="hidden md:block w-full">
        <div
          ref={desktopCarouselRef}
          className="flex overflow-x-auto gap-[21px] w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                data-vehicle-card
                className="flex-shrink-0"
                style={{ 
                  // Fixed width per card to ensure consistent scrolling
                  // Calculate: (container width - 3 gaps of 21px) / 4 = each card width
                  // But use minWidth to ensure cards don't shrink below a reasonable size
                  width: 'calc((100% - 63px) / 4)',
                  minWidth: 'min(calc((100% - 63px) / 4), 350px)', // Ensure minimum but respect container
                }}
              >
                <PublicVehicleCard vehicle={vehicle} />
              </div>
            ))}
        </div>
      </div>

      {/* Mobile: Single card with scroll dots */}
      <div className="md:hidden w-full">
        <MobileCarousel dotsGap="20px">
          {vehicles.map((vehicle) => (
            <PublicVehicleCard key={vehicle.id} vehicle={vehicle} disableSwipe={true} />
          ))}
        </MobileCarousel>
      </div>
    </div>
  )
}


export default FeaturedVehiclesBlock

