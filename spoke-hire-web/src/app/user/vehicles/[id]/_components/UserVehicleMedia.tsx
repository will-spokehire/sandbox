"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { Button } from "~/components/ui/button";
import { VehicleStatusBadge } from "~/components/vehicles/VehicleStatusBadge";
import { ImageEditDialog } from "~/components/vehicles/ImageEditDialog";
import { cn } from "~/lib/utils";
import type { VehicleDetail } from "~/types/vehicle";
import { useRequireAuth } from "~/providers/auth-provider";
import { useSwipeGesture } from "~/hooks/useSwipeGesture";

interface UserVehicleMediaProps {
  vehicle: VehicleDetail;
}

/**
 * User Vehicle Media Section
 * 
 * Simplified media gallery for vehicle owners - no admin actions
 * Displays hero image, thumbnails, and description
 */
export function UserVehicleMedia({ vehicle }: UserVehicleMediaProps) {
  const { user } = useRequireAuth();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const [loadedThumbnails, setLoadedThumbnails] = useState<Set<string>>(new Set());
  const [lightboxImageLoaded, setLightboxImageLoaded] = useState(false);
  const [lightboxFadeKey, setLightboxFadeKey] = useState(0);

  // Check if current user owns this vehicle or is an admin
  const canEdit = user && (
    user.id === vehicle.ownerId || 
    user.userType === "ADMIN"
  );

  // Filter and sort media - only show visible, ready images
  const sortedMedia = vehicle.media
    .filter((m) => m.type === "IMAGE" && m.status === "READY" && m.isVisible)
    .sort((a, b) => {
      // Primary images first
      if (a.isPrimary && !b.isPrimary) return -1;
      if (!a.isPrimary && b.isPrimary) return 1;
      // Then by order
      return a.order - b.order;
    });

  const mainImage = sortedMedia[selectedImageIndex];
  const hasImages = sortedMedia.length > 0;

  // Trigger fade animation when image index changes
  useEffect(() => {
    setIsImageLoaded(false);
    setFadeKey(prev => prev + 1);
  }, [selectedImageIndex]);

  // Trigger fade animation when lightbox image changes
  useEffect(() => {
    if (isLightboxOpen) {
      setLightboxImageLoaded(false);
      setLightboxFadeKey(prev => prev + 1);
    }
  }, [selectedImageIndex, isLightboxOpen]);

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const goToNext = () => {
    setSelectedImageIndex((prev) => (prev + 1) % sortedMedia.length);
  };

  const goToPrevious = () => {
    setSelectedImageIndex((prev) =>
      prev === 0 ? sortedMedia.length - 1 : prev - 1
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

  return (
    <div className="space-y-4">
      {/* Always stacked vertically: Hero image on top, thumbnails below */}
      <div className="flex flex-col gap-4">
        {/* Main/Hero Image - 4:3 aspect ratio */}
        <div className="relative overflow-hidden group">
          <div ref={swipeRef} className="relative aspect-[4/3] bg-spoke-grey rounded-md overflow-hidden">
            {hasImages && mainImage ? (
              <Image
                key={fadeKey}
                src={mainImage.publishedUrl ?? mainImage.originalUrl}
                alt={`${vehicle.name} - Main image`}
                fill
                className={cn(
                  "object-cover cursor-pointer transition-all duration-300 group-hover:scale-105",
                  isImageLoaded ? "opacity-100" : "opacity-0"
                )}
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
                onClick={() => openLightbox(selectedImageIndex)}
                onLoad={() => setIsImageLoaded(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">No images available</p>
                  <p className="text-sm">Images will appear here once uploaded</p>
                </div>
              </div>
            )}

            {/* Status Badge Overlay (Top-Left) */}
            <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10">
              <VehicleStatusBadge status={vehicle.status} />
            </div>

            {/* Edit Images Button (Top-Right) - Only show to owner or admin */}
            {canEdit && (
              <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="backdrop-blur-sm bg-background/80 hover:bg-background/90"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Images
                </Button>
              </div>
            )}

            {/* Navigation Arrows - Hidden on mobile, show on hover on desktop */}
            {sortedMedia.length > 1 && (
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

            {/* Image Counter */}
            {sortedMedia.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white body-xs px-3 py-1 rounded-full font-medium">
                {selectedImageIndex + 1} / {sortedMedia.length}
              </div>
            )}

            {/* Click to expand */}
            {hasImages && (
              <div className="absolute bottom-3 right-3 z-20 bg-black/60 text-white body-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                Click to expand
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Gallery - Always below hero image */}
        {hasImages && sortedMedia.length > 1 && (
          <div className="relative">
            {/* Thumbnails - Horizontal scrollable row */}
            <div 
              className="overflow-x-auto -mx-2 px-2 scrollbar-hide"
              style={{ 
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex gap-2">
                {sortedMedia.map((media, index) => {
                  return (
                    <button
                      key={media.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "relative flex-shrink-0 aspect-[4/3] rounded-md overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-md",
                        "w-[calc(25%-0.375rem)] md:w-[133px] md:h-[100px] md:aspect-auto",
                        selectedImageIndex === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Image
                        src={media.publishedUrl ?? media.originalUrl}
                        alt={`${vehicle.name} - Thumbnail ${index + 1}`}
                        fill
                        className={cn(
                          "object-cover transition-opacity duration-500",
                          loadedThumbnails.has(media.id) ? "opacity-100" : "opacity-0"
                        )}
                        sizes="(max-width: 768px) 25vw, 133px"
                        onLoad={() => setLoadedThumbnails(prev => new Set(prev).add(media.id))}
                      />
                      {media.isPrimary && (
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground body-xs px-1.5 py-0.5 rounded font-medium z-10">
                          Primary
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Description Section */}
        {vehicle.description && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              Description
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {vehicle.description}
            </p>
          </div>
        )}
      </div>

      {/* Lightbox - Using simplified custom modal */}
      {hasImages && isLightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Main Image */}
          <div className="max-w-4xl max-h-full flex flex-col items-center">
            <div className="relative max-w-full max-h-[80vh] flex items-center justify-center">
              <Image
                key={lightboxFadeKey}
                src={sortedMedia[selectedImageIndex]?.publishedUrl ?? sortedMedia[selectedImageIndex]?.originalUrl ?? ""}
                alt={`${vehicle.name} - Image ${selectedImageIndex + 1}`}
                width={1200}
                height={900}
                className={cn(
                  "max-w-full max-h-full object-contain rounded-lg transition-opacity duration-300",
                  lightboxImageLoaded ? "opacity-100" : "opacity-0"
                )}
                onClick={(e) => e.stopPropagation()}
                onLoad={() => setLightboxImageLoaded(true)}
              />
            </div>

            {/* Image Counter */}
            {sortedMedia.length > 1 && (
              <div className="mt-4 text-white text-center">
                <p className="text-sm">
                  {selectedImageIndex + 1} of {sortedMedia.length}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {sortedMedia.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev > 0 ? prev - 1 : sortedMedia.length - 1
                  );
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev < sortedMedia.length - 1 ? prev + 1 : 0
                  );
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Image Edit Dialog */}
      <ImageEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        vehicleId={vehicle.id}
        images={sortedMedia.map((m) => ({
          id: m.id,
          url: m.publishedUrl ?? m.originalUrl,
          order: m.order,
          isPrimary: m.isPrimary ?? false,
        }))}
      />
    </div>
  );
}

