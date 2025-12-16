'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '~/lib/utils'
import type { FeaturedVehiclesBlockData } from '~/lib/payload-api'
import { Button } from '~/components/ui/button'

interface FeaturedVehiclesBlockProps {
  data: FeaturedVehiclesBlockData
}

// Placeholder vehicle type - will integrate with actual vehicle data
interface Vehicle {
  id: string
  name: string
  make: string
  model: string
  year: number
  price?: number
  imageUrl?: string
}

/**
 * FeaturedVehiclesBlock Component
 *
 * Displays featured vehicles in various layouts.
 * Note: This component will need to be connected to the actual vehicle data source.
 */
export function FeaturedVehiclesBlock({ data }: FeaturedVehiclesBlockProps) {
  const {
    title,
    subtitle,
    selectionType,
    config,
    vehicleIds,
    limit = 6,
    displayStyle,
    columns,
  } = data
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Fetch vehicles based on selection type
  React.useEffect(() => {
    async function loadVehicles() {
      setIsLoading(true)
      try {
        // TODO: Implement actual vehicle fetching logic based on selectionType
        // For now, we'll show a placeholder message
        // The actual implementation would:
        // - 'config': Use the featured-vehicles-config settings
        // - 'manual': Fetch vehicles by the provided IDs
        // - 'latest': Fetch the most recent vehicles
        // - 'random': Fetch random vehicles

        // Placeholder: In production, replace with actual API calls
        console.log('FeaturedVehiclesBlock: Would fetch vehicles with:', {
          selectionType,
          config,
          vehicleIds,
          limit,
        })
        
        setVehicles([])
      } catch (error) {
        console.error('Error loading vehicles:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadVehicles()
  }, [selectionType, config, vehicleIds, limit])

  // Get column class based on columns value (handles both string and number)
  const getColumnClass = (cols: string | number) => {
    const colNum = String(cols)
    switch (colNum) {
      case '2': return 'grid-cols-1 md:grid-cols-2'
      case '3': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      case '4': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
      case '6': return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
      default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  if (isLoading) {
    return (
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto mb-8" />
            <div className={cn('grid gap-6', getColumnClass(columns))}>
              {Array.from({ length: Number(columns) }).map((_, i) => (
                <div key={i} className="aspect-[4/3] bg-muted rounded-lg" />
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
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Header */}
          {(title || subtitle) && (
            <div className="text-center mb-12">
              {title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>}
              {subtitle && (
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
              )}
            </div>
          )}

          {/* Placeholder */}
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground mb-4">
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
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
            )}
          </div>
        )}

        {/* Grid Display */}
        {displayStyle === 'grid' && (
          <div className={cn('grid gap-6', getColumnClass(columns))}>
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}

        {/* Carousel Display */}
        {displayStyle === 'carousel' && (
          <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="min-w-[280px] md:min-w-[320px] snap-center shrink-0">
                <VehicleCard vehicle={vehicle} />
              </div>
            ))}
          </div>
        )}

        {/* Masonry Display */}
        {displayStyle === 'masonry' && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {vehicles.map((vehicle) => (
              <div key={vehicle.id} className="break-inside-avoid">
                <VehicleCard vehicle={vehicle} />
              </div>
            ))}
          </div>
        )}

        {/* View All Link */}
        <div className="text-center mt-10">
          <Button asChild variant="outline" size="lg">
            <Link href="/vehicles">View All Vehicles</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

/**
 * Simple vehicle card component
 * In production, this would use the existing PublicVehicleCard component
 */
function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="block bg-card rounded-lg overflow-hidden border hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[4/3] bg-muted">
        {vehicle.imageUrl && (
          <img
            src={vehicle.imageUrl}
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{vehicle.name}</h3>
        <p className="text-muted-foreground text-sm">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </p>
        {vehicle.price && (
          <p className="text-primary font-medium mt-2">
            £{vehicle.price.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  )
}

export default FeaturedVehiclesBlock

