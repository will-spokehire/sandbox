"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getVehicleImageUrl } from "~/lib/vehicles";
import { cn } from "~/lib/utils";

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

  return (
    <article className="space-y-4">
      {/* Main Image with Navigation */}
      <Card className="relative overflow-hidden p-0">
        <div className="relative aspect-[3/2] bg-muted">
          <Image
            src={
              currentImage?.publishedUrl ??
              currentImage?.originalUrl ??
              getVehicleImageUrl([])
            }
            alt={vehicle.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
            className="object-cover"
            priority
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

          {/* Navigation Arrows */}
          {sortedMedia.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 backdrop-blur-sm"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 backdrop-blur-sm"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-sm text-sm font-medium">
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
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

