"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVehicleImageUrl } from "~/lib/vehicles";
import { cn } from "~/lib/utils";
import { useSwipeGesture } from "~/hooks/useSwipeGesture";
import { VEHICLE_DETAIL } from "~/lib/design-tokens";

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

  // Inject scrollbar hiding styles
  useEffect(() => {
    const styleId = 'scrollbar-hide-style';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);

  const hasMultipleImages = sortedMedia.length > 1;

  return (
    <article className={cn("flex flex-col", VEHICLE_DETAIL.mainImageThumbnailGap)}>
      {/* Main Image */}
      <div 
        ref={swipeRef} 
        className={cn(
          "relative overflow-hidden bg-muted group",
          VEHICLE_DETAIL.mainImageMobile,
          "md:aspect-[4/3] md:h-auto"
        )}
      >
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

        {/* Navigation Arrows - Hidden on mobile, show on hover on desktop */}
        {hasMultipleImages && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Gallery */}
      {sortedMedia.length > 1 && (
        <div className="relative">
          {/* Thumbnails - Horizontal scrollable row */}
          <div 
            className={cn("overflow-x-auto -mx-2 px-2 scrollbar-hide", VEHICLE_DETAIL.thumbnailGap)}
            style={{ 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div className="flex gap-2">
              {sortedMedia.map((media, index) => (
                <button
                  key={media.id}
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative flex-shrink-0 overflow-hidden",
                    "w-[calc(25%-0.375rem)] aspect-[4/3]",
                    "md:w-[133px] md:h-[100px] md:aspect-auto",
                    index === selectedImageIndex && "opacity-50"
                  )}
                >
                  <Image
                    src={media.publishedUrl ?? media.originalUrl}
                    alt={`${vehicle.name} - Image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 25vw, 133px"
                    className={cn(
                      "object-cover transition-opacity duration-500",
                      loadedThumbnails.has(media.id) ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setLoadedThumbnails(prev => new Set(prev).add(media.id))}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

