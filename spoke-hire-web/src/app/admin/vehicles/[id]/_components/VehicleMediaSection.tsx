"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit, Trash2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { VehicleStatusBadge } from "../../_components/VehicleStatusBadge";
import { VehicleStatusActions } from "./VehicleStatusActions";
import { getVehicleImageUrl } from "~/lib/vehicles";
import { cn } from "~/lib/utils";
import { type VehicleDetail } from "~/types/vehicle";

interface VehicleMediaSectionProps {
  vehicle: VehicleDetail;
}

/**
 * Vehicle Media Section
 * 
 * Displays the main hero image with action buttons and a thumbnail gallery below
 */
export function VehicleMediaSection({ vehicle }: VehicleMediaSectionProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

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

  const mainImage = sortedMedia[0];
  const hasImages = sortedMedia.length > 0;

  const handleEdit = () => {
    router.push(`/admin/vehicles/${vehicle.id}/edit`);
  };

  const handleDelete = () => {
    // TODO: Implement delete confirmation dialog
    console.log("Delete vehicle:", vehicle.id);
  };

  const openLightbox = (index: number) => {
    const images = sortedMedia.map((m) => m.publishedUrl || m.originalUrl);
    setLightboxImages(images);
    setSelectedImageIndex(index);
    setIsLightboxOpen(true);
  };

  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) =>
      prev > 0 ? prev - 1 : sortedMedia.length - 1
    );
  };

  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) =>
      prev < sortedMedia.length - 1 ? prev + 1 : 0
    );
  };

  const currentImage = sortedMedia[selectedImageIndex] || mainImage;

  return (
    <div className="space-y-4">
      {/* Main/Hero Image */}
      <Card className="relative overflow-hidden p-0 group">
        <div className="relative aspect-video md:aspect-[21/9] bg-muted">
          <Image
            src={
              currentImage?.publishedUrl ||
              currentImage?.originalUrl ||
              getVehicleImageUrl([])
            }
            alt={vehicle.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
          />

          {/* Status Badge Overlay (Top-Left) */}
          <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10">
            <VehicleStatusBadge status={vehicle.status} />
          </div>

          {/* Action Buttons (Top-Right) - Desktop */}
          <div className="hidden md:flex absolute top-4 right-4 z-10 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleEdit}
              className="gap-2 shadow-lg backdrop-blur-sm bg-background/90 hover:bg-background"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <VehicleStatusActions
              vehicleId={vehicle.id}
              currentStatus={vehicle.status}
            />
          </div>

          {/* Action Menu (Top-Right) - Mobile */}
          <div className="md:hidden absolute top-3 right-3 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-9 w-9 shadow-lg backdrop-blur-sm bg-background/90 hover:bg-background"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Vehicle
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Arrows - Show on hover or if multiple images */}
          {sortedMedia.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all opacity-0 group-hover:opacity-100"
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
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all opacity-0 group-hover:opacity-100"
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

          {/* Image Counter - Show current position */}
          {sortedMedia.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white text-xs md:text-sm px-3 py-1 rounded-full font-medium">
              {selectedImageIndex + 1} / {sortedMedia.length}
            </div>
          )}

          {/* Click to expand (if has images) */}
          {hasImages && (
            <button
              onClick={() => openLightbox(selectedImageIndex)}
              className="absolute inset-0 cursor-zoom-in"
              aria-label="View full-size image"
            />
          )}
        </div>
      </Card>

      {/* Thumbnail Gallery */}
      {hasImages && (
        <div className="relative">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {sortedMedia.map((media, index) => (
              <button
                key={media.id}
                onClick={() => openLightbox(index)}
                className={cn(
                  "relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-md overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-md",
                  selectedImageIndex === index
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                )}
              >
                <Image
                  src={media.publishedUrl || media.originalUrl}
                  alt={media.title || `Image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
                {media.isPrimary && (
                  <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium">
                    Primary
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Media Count Badge */}
          <div className="absolute -top-2 right-0 bg-background border rounded-full px-3 py-1 text-sm font-medium shadow-sm">
            {sortedMedia.length} {sortedMedia.length === 1 ? "photo" : "photos"}
          </div>
        </div>
      )}

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
                src={lightboxImages[selectedImageIndex] || ""}
                alt={`${vehicle.name} - Image ${selectedImageIndex + 1}`}
                width={1200}
                height={800}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Image Counter */}
            {lightboxImages.length > 1 && (
              <div className="mt-4 text-white text-center">
                <p className="text-sm">
                  {selectedImageIndex + 1} of {lightboxImages.length}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Arrows */}
          {lightboxImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex((prev) =>
                    prev > 0 ? prev - 1 : lightboxImages.length - 1
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
                    prev < lightboxImages.length - 1 ? prev + 1 : 0
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
    </div>
  );
}

