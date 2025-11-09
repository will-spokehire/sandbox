/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '~/components/ui/card';
import { VehicleStatusBadge } from '~/components/vehicles/VehicleStatusBadge';
import { useSwipeGesture } from '~/hooks/useSwipeGesture';
import { formatPricingRate } from '~/lib/pricing';
import { cn } from '~/lib/utils';
import type { VehicleStatus } from '@prisma/client';

interface VehicleMedia {
  id: string;
  publishedUrl: string | null;
  originalUrl: string;
  type: string;
  altText: string | null;
  order: number;
  isPrimary: boolean;
}

interface UserVehicleCardProps {
  vehicle: {
    id: string;
    name: string;
    year: string;
    status: VehicleStatus;
    hourlyRate?: number | null;
    dailyRate?: number | null;
    make: {
      id: string;
      name: string;
    };
    model: {
      id: string;
      name: string;
    };
    media: VehicleMedia[];
    _count: {
      media: number;
    };
  };
  href?: string; // Optional custom href for testing/other use cases
}

/**
 * User Vehicle Card Component
 * 
 * Displays a vehicle card for regular users (non-admin).
 * Shows primary image with carousel navigation, name, make/model, year, and status.
 */
export function UserVehicleCard({ vehicle, href }: UserVehicleCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const linkHref = href ?? `/user/vehicles/${vehicle.id}`;

  // Trigger fade animation when image index changes
  useEffect(() => {
    setIsImageLoaded(false);
    setFadeKey(prev => prev + 1);
  }, [currentImageIndex]);

  // Navigation functions
  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % vehicle.media.length);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? vehicle.media.length - 1 : prev - 1
    );
  };

  // Touch navigation functions (without event handling)
  const goToNextTouch = () => {
    setCurrentImageIndex((prev) => (prev + 1) % vehicle.media.length);
  };

  const goToPreviousTouch = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? vehicle.media.length - 1 : prev - 1
    );
  };

  // Swipe gesture for mobile
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: goToNextTouch,
    onSwipeRight: goToPreviousTouch,
  });

  // Get current image based on index
  const currentImage = vehicle.media[currentImageIndex];
  const imageUrl = currentImage?.publishedUrl || currentImage?.originalUrl;

  return (
    <Link href={linkHref}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer p-0 gap-0">
        <div ref={swipeRef} className="relative aspect-[4/3] bg-slate-100 dark:bg-slate-800 group">
          {imageUrl ? (
            <Image
              key={fadeKey}
              src={imageUrl}
              alt={currentImage?.altText || vehicle.name}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                isImageLoaded ? "opacity-100" : "opacity-0"
              )}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onLoad={() => setIsImageLoaded(true)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          
          {/* Status Badge - Top Left */}
          <div className="absolute top-3 left-3 z-10">
            <VehicleStatusBadge status={vehicle.status} />
          </div>

          {/* Navigation Arrows - Hidden on mobile, show on hover on desktop */}
          {vehicle.media.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all hidden lg:flex lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Previous image"
              >
                <svg
                  className="h-5 w-5 md:h-6 md:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all hidden lg:flex lg:opacity-0 lg:group-hover:opacity-100"
                aria-label="Next image"
              >
                <svg
                  className="h-5 w-5 md:h-6 md:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Image Counter - Bottom Right */}
          {vehicle._count.media > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
              {currentImageIndex + 1} / {vehicle._count.media}
            </div>
          )}
        </div>

        <div className="p-4 pt-3">
          <h3 className="font-semibold text-lg mb-1 text-slate-900 dark:text-slate-50 truncate">
            {vehicle.name}
          </h3>
          <p className="text-sm font-medium text-primary mb-2">
            {[
              vehicle.hourlyRate && `£${vehicle.hourlyRate} hourly`,
              vehicle.dailyRate && `£${vehicle.dailyRate} daily`
            ].filter(Boolean).join(' • ') || 'Pricing not set'}
          </p>
        </div>
      </Card>
    </Link>
  );
}
