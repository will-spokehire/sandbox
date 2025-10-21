"use client";

import { useState } from "react";
import Image from "next/image";
import { MoreHorizontal, Mail, Phone, MessageCircle, Send, Pencil } from "lucide-react";
import { Card } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { VehicleStatusBadge } from "~/components/vehicles/VehicleStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ImageEditDialog } from "~/components/vehicles/ImageEditDialog";
import { getVehicleImageUrl } from "~/lib/vehicles";
import { cn } from "~/lib/utils";
import { type VehicleDetail } from "~/types/vehicle";
import { toast } from "sonner";
import { getWhatsAppChatUrl } from "~/lib/whatsapp";

interface VehicleMediaSectionProps {
  vehicle: VehicleDetail;
  onSendDeal?: () => void;
}

/**
 * Vehicle Media Section
 * 
 * Displays the main hero image with action buttons and a thumbnail gallery below
 */
export function VehicleMediaSection({ vehicle, onSendDeal }: VehicleMediaSectionProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

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

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error(`Failed to copy ${label}`);
    }
  };

  const openLightbox = (index: number) => {
    const images = sortedMedia.map((m) => m.publishedUrl ?? m.originalUrl);
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

  const currentImage = sortedMedia[selectedImageIndex] ?? mainImage;

  return (
    <div className="space-y-4">
      {/* Always stacked vertically: Hero image on top, thumbnails below */}
      <div className="flex flex-col gap-4">
        {/* Main/Hero Image - 3:2 aspect ratio */}
        <Card className="relative overflow-hidden p-0 group">
          <div className="relative aspect-[3/2] bg-muted">
          <Image
            src={
              currentImage?.publishedUrl ??
              currentImage?.originalUrl ??
              getVehicleImageUrl([])
            }
            alt={vehicle.name}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 900px"
          />

          {/* Status Badge Overlay (Top-Left) */}
          <div className="absolute top-3 left-3 md:top-4 md:left-4 z-10">
            <VehicleStatusBadge status={vehicle.status} />
          </div>

          {/* Action Menu (Top-Right) - All Screens */}
          <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
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
                
                {/* Edit Images */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Images
                </DropdownMenuItem>
                
                {/* Send Deal */}
                {onSendDeal && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendDeal();
                    }}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send Deal
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Contact Owner</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {/* Copy Email */}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    void copyToClipboard(vehicle.owner.email, 'Email');
                  }}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Copy Email
                </DropdownMenuItem>
                
                {/* Copy Phone */}
                {vehicle.owner.phone && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      void copyToClipboard(vehicle.owner.phone!, 'Phone number');
                    }}
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Copy Phone
                  </DropdownMenuItem>
                )}
                
                {/* WhatsApp Chat */}
                {vehicle.owner.phone && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(getWhatsAppChatUrl(vehicle.owner.phone!), '_blank');
                      }}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      WhatsApp Chat
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Navigation Arrows - Always visible on mobile, show on hover on desktop */}
          {sortedMedia.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
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
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 md:p-3 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
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

        {/* Thumbnail Gallery - Always below hero image */}
        {hasImages && sortedMedia.length > 1 && (
          <div className="relative">
            {/* Thumbnails - Horizontal scrollable grid */}
            <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
              {sortedMedia.slice(0, 12).map((media, index) => {
                const isLastThumb = index === 11 && sortedMedia.length > 12;
                const remainingCount = sortedMedia.length - 12;
                
                return (
                  <button
                    key={media.id}
                    onClick={() => isLastThumb ? openLightbox(index) : setSelectedImageIndex(index)}
                    className={cn(
                      "relative aspect-[3/2] rounded-md overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-md",
                      selectedImageIndex === index
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Image
                      src={media.publishedUrl ?? media.originalUrl}
                      alt={media.title ?? `Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 96px, 140px"
                    />
                    {media.isPrimary && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded font-medium z-10">
                        Primary
                      </div>
                    )}
                    {isLastThumb && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-2xl font-bold">+{remainingCount}</div>
                          <div className="text-xs mt-1">more</div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
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
                src={lightboxImages[selectedImageIndex] ?? ""}
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
        onSuccess={() => {
          // Refetch will happen automatically via query invalidation
          // This callback is just to ensure the parent component knows
        }}
      />
    </div>
  );
}

