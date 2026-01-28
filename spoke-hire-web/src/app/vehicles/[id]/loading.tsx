import { Skeleton } from "~/components/ui/skeleton";
import { VEHICLE_DETAIL, LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

/**
 * Loading skeleton for vehicle detail page
 * Matches the new design structure without rounded corners
 */
export default function Loading() {
  return (
    <div className={LAYOUT_CONSTANTS.bgDefault}>
      {/* Header Skeleton */}
      <div className="bg-white">
        {/* Breadcrumbs Skeleton */}
        <div className={cn(VEHICLE_DETAIL.breadcrumbsTopPadding, VEHICLE_DETAIL.breadcrumbsHorizontalPadding, "pb-0")}>
          <Skeleton className="h-[18px] md:h-[22px] w-48 rounded-none" />
        </div>

        {/* Title & Location Skeleton */}
        <div className={cn(VEHICLE_DETAIL.headerPadding, "pt-5 md:pt-[41px] pb-5 md:pb-[41px]", VEHICLE_DETAIL.breadcrumbsTitleGap)}>
          <div className={cn("flex flex-col", VEHICLE_DETAIL.titleLocationGap)}>
            <Skeleton className="h-[48px] md:h-[64px] w-full max-w-2xl rounded-none" />
            <Skeleton className="h-[18px] md:h-[22px] w-64 rounded-none" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className={cn(VEHICLE_DETAIL.containerPadding, "py-5 md:py-10 pb-4 md:pb-10")}>
        {/* Two-Column Layout Skeleton */}
        <div className={VEHICLE_DETAIL.detailGrid}>
          {/* Left Column - Media Gallery Skeleton */}
          <div className={cn(VEHICLE_DETAIL.detailGridLeft, "space-y-8")}>
            {/* Main Image */}
            <div className={cn("relative overflow-hidden bg-muted", VEHICLE_DETAIL.mainImageMobile, "md:aspect-[4/3] md:h-auto")}>
              <Skeleton className="absolute inset-0 rounded-none" />
            </div>
            
            {/* Thumbnails */}
            <div className={cn("flex", VEHICLE_DETAIL.thumbnailGap)}>
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton 
                  key={i} 
                  className={cn(
                    "flex-1 min-w-0",
                    VEHICLE_DETAIL.thumbnailAspect,
                    "md:flex-none md:w-[133px] md:h-[100px] md:aspect-auto",
                    "rounded-none"
                  )} 
                />
              ))}
            </div>

            {/* Description Skeleton */}
            <div className="flex flex-col gap-3.5">
              <Skeleton className="h-[32px] md:h-[36px] w-32 rounded-none" />
              <Skeleton className="h-[18px] w-full rounded-none" />
              <Skeleton className="h-[18px] w-full rounded-none" />
              <Skeleton className="h-[18px] w-3/4 rounded-none" />
            </div>
          </div>

          {/* Right Column - Details Skeleton */}
          <div className={cn(VEHICLE_DETAIL.detailGridRight, "space-y-8")}>
            {/* Make Enquiry Button Skeleton */}
            <Skeleton className="h-[48px] w-full rounded-none" />

            {/* Details Section Skeleton */}
            <div className={cn("flex flex-col", VEHICLE_DETAIL.sectionGap)}>
              <Skeleton className="h-[32px] md:h-[36px] w-32 rounded-none" />
              <div className={cn("flex flex-col", VEHICLE_DETAIL.detailRowGap)}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <Skeleton className="h-[18px] w-32 rounded-none" />
                    <Skeleton className="h-[18px] w-24 rounded-none" />
                  </div>
                ))}
              </div>
            </div>

            {/* Tags Skeleton */}
            <div className={cn("flex flex-wrap", VEHICLE_DETAIL.tagGap)}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-20 rounded-none" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

