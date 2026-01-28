"use client";

import * as React from "react";
import Image from "next/image";
import { api } from "~/trpc/react";
import { PublicVehicleCard } from "~/app/vehicles/_components/PublicVehicleCard";
import { MobileCarousel } from "~/components/ui/mobile-carousel";
import { TYPOGRAPHY, LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

interface SimilarVehiclesProps {
  vehicleId: string;
}

/**
 * Similar Vehicles Component
 * 
 * Displays similar vehicles based on same make or same decade.
 * Desktop: Grid with navigation arrows
 * Mobile: Carousel with scroll dots
 */
export function SimilarVehicles({ vehicleId }: SimilarVehiclesProps) {
  const { data: vehicles, isLoading } = api.publicVehicle.getSimilar.useQuery(
    { vehicleId },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: false,
    }
  );

  const desktopCarouselRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [needsScroll, setNeedsScroll] = React.useState(false);

  const checkScrollability = React.useCallback(() => {
    const desktopContainer = desktopCarouselRef.current;

    // Check desktop carousel for arrow states
    if (desktopContainer) {
      const computedStyle = window.getComputedStyle(desktopContainer);
      const isVisible = computedStyle.display !== "none" && computedStyle.visibility !== "hidden";

      if (isVisible && desktopContainer.scrollWidth > 0) {
        const desktopScrollLeft = desktopContainer.scrollLeft;
        const desktopScrollWidth = desktopContainer.scrollWidth;
        const desktopClientWidth = desktopContainer.clientWidth;

        const scrollThreshold = 5;
        const canScroll = desktopScrollWidth > desktopClientWidth + scrollThreshold;

        setNeedsScroll(canScroll);

        if (canScroll) {
          const canScrollLeftValue = desktopScrollLeft > scrollThreshold;
          const maxScroll = desktopScrollWidth - desktopClientWidth;
          const canScrollRightValue = desktopScrollLeft < maxScroll - scrollThreshold;

          setCanScrollLeft(canScrollLeftValue);
          setCanScrollRight(canScrollRightValue);
        } else {
          setCanScrollLeft(false);
          setCanScrollRight(false);
        }
      }
    }
  }, []);

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        checkScrollability();
      }, 50);
    });

    if (desktopCarouselRef.current) {
      resizeObserver.observe(desktopCarouselRef.current);
    }

    const desktopCarousel = desktopCarouselRef.current;

    const checkAfterLayout = () => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          checkScrollability();
        }, 150);
      });
    };

    checkAfterLayout();

    if (desktopCarousel) {
      desktopCarousel.addEventListener("scroll", checkScrollability);
    }
    window.addEventListener("resize", checkAfterLayout);

    return () => {
      resizeObserver.disconnect();
      if (desktopCarousel) {
        desktopCarousel.removeEventListener("scroll", checkScrollability);
      }
      window.removeEventListener("resize", checkAfterLayout);
    };
  }, [checkScrollability]);

  const scrollLeft = () => {
    const container = desktopCarouselRef.current;
    if (container) {
      const firstCard = container.querySelector("[data-vehicle-card]") as HTMLElement;
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 21;
        container.scrollBy({ left: -(cardWidth + gap), behavior: "smooth" });
      } else {
        container.scrollBy({ left: -320, behavior: "smooth" });
      }
    }
  };

  const scrollRight = () => {
    const container = desktopCarouselRef.current;
    if (container) {
      const firstCard = container.querySelector("[data-vehicle-card]") as HTMLElement;
      if (firstCard) {
        const cardWidth = firstCard.offsetWidth;
        const gap = 21;
        container.scrollBy({ left: cardWidth + gap, behavior: "smooth" });
      } else {
        container.scrollBy({ left: 320, behavior: "smooth" });
      }
    }
  };

  // Don't render if loading or no vehicles
  if (isLoading) {
    return null; // Or return a loading skeleton if desired
  }

  if (!vehicles || vehicles.length === 0) {
    return null; // Hide section if no similar vehicles
  }

  return (
    <section
      className={cn(
        "bg-white flex flex-col items-center overflow-clip",
        "px-0",
        "pt-[41px] gap-[20px] md:gap-[41px]"
      )}
      aria-label="Similar vehicles"
    >
      {/* Desktop: Title Layout */}
      <div className="hidden md:flex items-end relative shrink-0 w-full max-w-[1448px]">
        <div className="flex flex-col gap-3 items-start not-italic relative shrink-0 text-black w-[711px]">
          <h2 className={cn(TYPOGRAPHY.h2, "leading-[0.95] relative shrink-0 text-nowrap tracking-[-0.64px] uppercase")}>
            classic cars like this
          </h2>
          <p className={cn(TYPOGRAPHY.bodyLarge, "leading-[1.3] min-w-full relative shrink-0 tracking-[-0.22px] w-[min-content]")}>
            See similar vehicles that fit your brief.
          </p>
        </div>
      </div>

      {/* Mobile: Title Layout */}
      <div className="md:hidden flex flex-col gap-[11px] items-start relative shrink-0 w-full">
        <h2 className={cn(TYPOGRAPHY.h2, "leading-[0.95] relative shrink-0 text-nowrap tracking-[-0.42px] uppercase")}>
          more like this
        </h2>
        <p className={cn(TYPOGRAPHY.bodyLarge, "leading-[1.4] min-w-full relative shrink-0 tracking-[-0.18px] w-[min-content]")}>
          See similar vehicles that fit your brief.
        </p>
      </div>

      {/* Carousel Container */}
      <div className="flex flex-col gap-[10px] items-start relative shrink-0 w-full">
        {/* Desktop: Navigation Arrows */}
        {needsScroll && (
          <div className="hidden md:flex items-center justify-between px-0 py-[10px] relative shrink-0 w-full">
            <button
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              className={cn(
                "h-[40px] w-[100px] flex items-center justify-center shrink-0 relative",
                "transition-opacity",
                !canScrollLeft && "opacity-30 cursor-not-allowed"
              )}
              aria-label="Scroll left"
            >
              <Image
                src="/arrow-left.svg"
                alt="Previous"
                width={101}
                height={15}
                className="w-full h-full object-contain"
              />
            </button>

            <button
              onClick={scrollRight}
              disabled={!canScrollRight}
              className={cn(
                "h-[40px] w-[100px] flex items-center justify-center shrink-0 relative",
                "transition-opacity",
                !canScrollRight && "opacity-30 cursor-not-allowed"
              )}
              aria-label="Scroll right"
            >
              <Image
                src="/arrow-right.svg"
                alt="Next"
                width={101}
                height={15}
                className="w-full h-full object-contain"
              />
            </button>
          </div>
        )}

        {/* Desktop: Grid of 4 cards */}
        <div className="hidden md:block w-full">
          <div
            ref={desktopCarouselRef}
            className="flex overflow-x-auto gap-[21px] w-full"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                data-vehicle-card
                className="flex-shrink-0"
                style={{
                  width: "calc((100% - 63px) / 4)",
                  minWidth: "min(calc((100% - 63px) / 4), 350px)",
                }}
              >
                <PublicVehicleCard vehicle={vehicle} />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Single card carousel */}
        <div className="md:hidden w-full">
          <MobileCarousel dotsGap="20px">
            {vehicles.map((vehicle) => (
              <PublicVehicleCard key={vehicle.id} vehicle={vehicle} disableSwipe={true} />
            ))}
          </MobileCarousel>
        </div>
      </div>
    </section>
  );
}

