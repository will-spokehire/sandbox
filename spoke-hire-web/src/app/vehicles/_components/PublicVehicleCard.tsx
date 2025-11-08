"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeGesture } from "~/hooks/useSwipeGesture";
import { cn } from "~/lib/utils";

interface PublicVehicleCardProps {
  vehicle: {
    id: string;
    name: string;
    year: string;
    make: {
      name: string;
    };
    model: {
      name: string;
    };
    media: Array<{
      publishedUrl: string | null;
      originalUrl: string;
    }>;
    collections?: Array<{
      id: string;
      name: string;
    }>;
    owner: {
      city: string | null;
      county: string | null;
      country: {
        name: string;
      } | null;
    };
  };
}

/**
 * Public Vehicle Card
 * 
 * Display card for a single vehicle in the public catalog.
 * Shows image carousel with navigation arrows, make/model, year, location, and collections.
 * NO price displayed.
 */
export function PublicVehicleCard({ vehicle }: PublicVehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  
  const images = vehicle.media.filter((m) => m.publishedUrl || m.originalUrl);
  const currentImage = images[currentImageIndex];
  const imageUrl = currentImage?.publishedUrl ?? currentImage?.originalUrl ?? "/placeholder-vehicle.jpg";
  const hasMultipleImages = images.length > 1;

  // Trigger fade animation when image index changes
  useEffect(() => {
    setIsImageLoaded(false);
    setFadeKey(prev => prev + 1);
  }, [currentImageIndex]);

  // Format location string
  const location = [
    vehicle.owner.city,
    vehicle.owner.county,
    vehicle.owner.country?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const goToPreviousTouch = () => {
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNextTouch = () => {
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Swipe gesture for mobile
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: goToNextTouch,
    onSwipeRight: goToPreviousTouch,
  });

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full flex flex-col gap-0 p-0">
        {/* Image with Navigation */}
        <div ref={swipeRef} className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <Image
            key={fadeKey}
            src={imageUrl}
            alt={`${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover transition-all duration-300 group-hover:scale-105",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />

          {/* Image Counter - Bottom right */}
          {hasMultipleImages && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
              {currentImageIndex + 1} / {images.length}
            </div>
          )}

          {/* Navigation Arrows - Hidden on mobile, show on hover on desktop */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg hidden md:flex opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg hidden md:flex opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Content Area - Manual padding instead of CardContent */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Vehicle Name */}
          <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors mb-2">
            {vehicle.year} {vehicle.make.name} {vehicle.model.name}
          </h3>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {/* Collections/Tags */}
          {vehicle.collections && vehicle.collections.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-auto">
              {vehicle.collections.slice(0, 3).map((collection) => (
                <Badge key={collection.id} variant="secondary" className="text-xs">
                  {collection.name}
                </Badge>
              ))}
              {vehicle.collections.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{vehicle.collections.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

