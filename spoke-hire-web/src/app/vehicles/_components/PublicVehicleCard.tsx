"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";

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
  const images = vehicle.media.filter((m) => m.publishedUrl || m.originalUrl);
  const currentImage = images[currentImageIndex];
  const imageUrl = currentImage?.publishedUrl ?? currentImage?.originalUrl ?? "/placeholder-vehicle.jpg";
  const hasMultipleImages = images.length > 1;

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

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <Link href={`/vehicles/${vehicle.id}`} className="group block">
      <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full flex flex-col p-0">
        {/* Image with Navigation */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <Image
            src={imageUrl}
            alt={`${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />

          {/* Navigation Arrows - Show only on hover */}
          {hasMultipleImages && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-all shadow-lg opacity-0 group-hover:opacity-100"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        <div className="p-4 space-y-3 flex-1 flex flex-col">
          {/* Vehicle Name */}
          <div>
            <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
              {vehicle.year} {vehicle.make.name} {vehicle.model.name}
            </h3>
          </div>

          {/* Location */}
          {location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
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

