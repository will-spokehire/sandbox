"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVehicleImageUrl } from "~/lib/vehicles";
import { cn } from "~/lib/utils";
import { useSwipeGesture } from "~/hooks/useSwipeGesture";

interface PublicVehicleMediaSectionProps {
  vehicle: {
    name: string;
    media: Array<{
      id: string;
      publishedUrl: string | null;
      originalUrl: string;
      type: string;
      status: string;
      isVisible: boolean;
      isPrimary: boolean;
      order: number;
    }>;
    collections?: Array<{
      id: string;
      name: string;
    }>;
  };
}

/**
 * Public Vehicle Media Section
 * 
 * Displays vehicle images in a gallery format for public viewing.
 * No edit buttons or admin actions.
 */
export function PublicVehicleMediaSection({ vehicle }: PublicVehicleMediaSectionProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set());

  // Filter and sort media
  const sortedMedia = vehicle.media
    .filter((m) => m.type === "IMAGE" && m.status === "READY" && m.isVisible)
    .sort((a, b) => {
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      return a.order - b.order;
    });

  const hasImages = sortedMedia.length > 0;
  const currentImage = sortedMedia[selectedImageIndex];

  // Trigger fade animation when image index changes
  useEffect(() => {
    setIsImageLoaded(false);
    setFadeKey(prev => prev + 1);
  }, [selectedImageIndex]);

  const goToPrevious = () => {
    setSelectedImageIndex((prev) =>
      prev > 0 ? prev - 1 : sortedMedia.length - 1
    );
  };

  const goToNext = () => {
    setSelectedImageIndex((prev) =>
      prev < sortedMedia.length - 1 ? prev + 1 : 0
    );
  };

  // Swipe gesture for mobile
  const swipeRef = useSwipeGesture<HTMLDivElement>({
    onSwipeLeft: goToNext,
    onSwipeRight: goToPrevious,
  });

  return (
    <article className="space-y-4">
      {/* Main Image with Navigation */}
      <Card className="relative overflow-hidden p-0">
        <div ref={swipeRef} className="relative aspect-[3/2] bg-muted">
          <Image
            key={fadeKey}
            src={
              currentImage?.publishedUrl ??
              currentImage?.originalUrl ??
              getVehicleImageUrl([])
            }
            alt={vehicle.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
            className={cn(
              "object-cover transition-opacity duration-300",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
            priority
            onLoad={() => setIsImageLoaded(true)}
          />

          {/* Collections Badge Overlay */}
          {vehicle.collections && vehicle.collections.length > 0 && (
            <div className="absolute top-4 right-4 flex flex-wrap gap-2 max-w-[200px]">
              {vehicle.collections.slice(0, 3).map((collection) => (
                <Badge
                  key={collection.id}
                  variant="secondary"
                  className="backdrop-blur-sm bg-background/80"
                >
                  {collection.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Navigation Arrows - Hidden on mobile, show on desktop */}
          {sortedMedia.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all hidden md:flex md:opacity-70 md:hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all hidden md:flex md:opacity-70 md:hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white text-xs md:text-sm px-3 py-1 rounded-full font-medium">
                {selectedImageIndex + 1} / {sortedMedia.length}
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Thumbnail Gallery */}
      {sortedMedia.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {sortedMedia.map((media, index) => (
            <button
              key={media.id}
              onClick={() => setSelectedImageIndex(index)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border-2 transition-all",
                index === selectedImageIndex
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              <Image
                src={media.publishedUrl ?? media.originalUrl}
                alt={`${vehicle.name} - Image ${index + 1}`}
                fill
                sizes="100px"
                className={cn(
                  "object-cover transition-opacity duration-500",
                  loadedThumbnails.has(media.id) ? "opacity-100" : "opacity-0"
                )}
                onLoad={() => setLoadedThumbnails(prev => new Set(prev).add(media.id))}
              />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

