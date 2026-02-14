import Link from 'next/link'
import Image from 'next/image'
import { cn } from '~/lib/utils'
import type { FeaturedVehiclesBlockData } from '~/lib/payload-api'
import { Button } from '~/components/ui/button'
import { LAYOUT_CONSTANTS, CARD_STYLES } from '~/lib/design-tokens'
import { db } from '~/server/db'
import { ServiceFactory } from '~/server/api/services/service-factory'
import { FeaturedVehiclesCarousel } from './FeaturedVehiclesCarousel'

interface FeaturedVehiclesBlockProps {
  data: FeaturedVehiclesBlockData
  /** Whether this block is a candidate for LCP (Largest Contentful Paint) optimization */
  isLCPCandidate?: boolean
}

// Vehicle type from API response
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
 * Static Vehicle Card - Server Component
 * 
 * A server-rendered vehicle card for the featured vehicles carousel.
 * Shows first image only (no client-side carousel within card).
 * Fully SEO-visible - crawlers see all vehicle info.
 */
function StaticVehicleCard({ vehicle, priority = false }: { vehicle: Vehicle; priority?: boolean }) {
  const firstImage = vehicle.media[0]
  const imageUrl = firstImage?.publishedUrl ?? firstImage?.originalUrl ?? "/placeholder-vehicle.jpg"
  
  // Format location string
  const location = [
    vehicle.owner.city,
    vehicle.owner.county,
    vehicle.owner.country?.name,
  ]
    .filter(Boolean)
    .join(", ")

  // Format title: year make model (uppercase)
  const title = `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`.toUpperCase()

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="group block">
      <div className="bg-white flex flex-col gap-4 overflow-clip">
        {/* Image Container - 4:3 aspect ratio */}
        <div className="relative w-full overflow-hidden bg-spoke-grey aspect-[4/3]">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
            priority={priority}
            fetchPriority={priority ? 'high' : 'auto'}
          />
        </div>

        {/* Content */}
        <div className="flex flex-col gap-1 text-black">
          {/* Vehicle Title */}
          <div className={cn(CARD_STYLES.vehicleCardTitle, "text-spoke-black")}>
            {title}
          </div>

          {/* Location */}
          {location && (
            <p className={cn(CARD_STYLES.vehicleCardLocation, "text-spoke-black/70")}>
              {location}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

/**
 * FeaturedVehiclesBlock Component - SERVER COMPONENT
 *
 * Displays featured vehicles in carousel format.
 * Data is fetched server-side for SEO - all vehicle cards are server-rendered.
 * The FeaturedVehiclesCarousel client component handles only the interactive parts.
 * 
 * Supports two selection types:
 * - 'manual': Select specific vehicles by entering their IDs
 * - 'latest': Show the most recently added vehicles
 */
export async function FeaturedVehiclesBlock({ data, isLCPCandidate = false }: FeaturedVehiclesBlockProps) {
  const {
    title,
    subtitle,
    selectionType,
    vehicleIds,
    limit = 6,
    showMobileButton = true,
  } = data

  // Server-side data fetching using service directly (bypasses tRPC headers() for static generation)
  let vehicles: Vehicle[] = []

  // Map service result to public vehicle format (same as tRPC router)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapToPublicVehicle = (v: any): Vehicle => ({
    id: v.id,
    name: v.name,
    year: v.year,
    make: { name: v.make.name },
    model: { name: v.model.name },
    media: v.media.map((m: { publishedUrl: string | null; originalUrl: string }) => ({
      publishedUrl: m.publishedUrl,
      originalUrl: m.originalUrl,
    })),
    collections: v.collections,
    owner: {
      city: v.owner.city,
      county: v.owner.county,
      country: v.owner.country,
    },
  })

  try {
    const vehicleService = ServiceFactory.createVehicleService(db)

    if (selectionType === 'latest') {
      const result = await vehicleService.listVehicles({
        status: 'PUBLISHED',
        limit: limit ?? 6,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      vehicles = result.vehicles.map(mapToPublicVehicle)
    } else if (selectionType === 'manual' && vehicleIds && vehicleIds.length > 0) {
      // Fetch manual vehicles using vehicleIds filter
      const manualVehicleIds = vehicleIds.map((v) => v.vehicleId).filter(Boolean)
      const result = await vehicleService.listVehicles({
        status: 'PUBLISHED',
        vehicleIds: manualVehicleIds,
      })
      // Map and preserve the order from vehicleIds
      const vehicleMap = new Map(result.vehicles.map((v) => [v.id, mapToPublicVehicle(v)]))
      vehicles = manualVehicleIds
        .map((id) => vehicleMap.get(id))
        .filter((v): v is Vehicle => v !== undefined)
    }
  } catch (error) {
    console.error('Error fetching featured vehicles:', error)
    vehicles = []
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
      <div className="mx-auto w-full flex flex-col gap-5 items-center">
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

        {/* Carousel Display - Client component wraps server-rendered cards */}
        <FeaturedVehiclesCarousel itemCount={vehicles.length} showMobileButton={showMobileButton}>
          {vehicles.map((vehicle, index) => (
            <StaticVehicleCard key={vehicle.id} vehicle={vehicle} priority={index === 0 && isLCPCandidate} />
          ))}
        </FeaturedVehiclesCarousel>

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

export default FeaturedVehiclesBlock

