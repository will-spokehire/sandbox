"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSwipeGesture } from "~/hooks/useSwipeGesture";
import { cn } from "~/lib/utils";
import { CARD_STYLES } from "~/lib/design-tokens";

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
 * Simplified card design matching Figma specifications.
 * Shows image carousel, year/make/model, and location.
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

  // Format title: year make model (uppercase)
  const title = `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`.toUpperCase();

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
      <div className="bg-white flex flex-col gap-4 overflow-clip">
        {/* Image Container - 4:3 aspect ratio */}
        <div 
          ref={swipeRef}
          className="relative w-full overflow-hidden bg-spoke-grey aspect-[4/3]"
        >
          <Image
            key={fadeKey}
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={cn(
              "object-cover object-center transition-opacity duration-300 group-hover:scale-105 transition-transform duration-300",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />

          {/* Navigation Arrows - Hidden on mobile, show on hover on desktop */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Content - Gap of 4px between title and location */}
        <div className="flex flex-col gap-1 text-black">
          {/* Vehicle Title - Using vehicle-card-title class */}
          <div className={cn(CARD_STYLES.vehicleCardTitle, "text-spoke-black")}>
            {title}
          </div>

          {/* Location - Using body-large class */}
          {location && (
            <p className={cn(CARD_STYLES.vehicleCardLocation, "text-spoke-black/70")}>
              {location}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

