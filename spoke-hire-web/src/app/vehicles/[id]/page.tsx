import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { api } from "~/trpc/server";
import { db } from "~/server/db";
import { PublicVehicleMediaSection } from "./_components/PublicVehicleMediaSection";
import { PublicVehicleBasicInfo } from "./_components/PublicVehicleBasicInfo";
import { VehicleDetailHeader } from "./_components/VehicleDetailHeader";
import { VehicleViewTracker } from "./_components/VehicleViewTracker";
import { SimilarVehicles } from "./_components/SimilarVehicles";
import { getAppUrl } from "~/lib/app-url";
import { LAYOUT_CONSTANTS, TYPOGRAPHY, VEHICLE_DETAIL } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";
import { getBlocksByPageSlug } from "~/lib/payload-api";
import { BlockRenderer } from "~/components/blocks/BlockRenderer";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Enable Incremental Static Regeneration (ISR)
 * Revalidate every hour to keep content fresh while benefiting from static generation
 */
export const revalidate = 3600; // 1 hour

/**
 * Generate static params for popular vehicles at build time
 * This pre-renders the most important vehicle pages for better SEO and performance
 * 
 * Note: Uses Prisma directly to avoid tRPC header issues during build
 */
export async function generateStaticParams() {
  try {
    // Fetch top 50 most recently published vehicles to pre-render at build time
    // Use Prisma directly instead of tRPC to avoid headers() issues during build
    const vehicles = await db.vehicle.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return vehicles.map((vehicle) => ({
      id: vehicle.id,
    }));
  } catch (error) {
    console.error("Failed to generate static params for vehicles:", error);
    // Return empty array to allow dynamic rendering as fallback
    return [];
  }
}

/**
 * Generate dynamic metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const vehicle = await api.publicVehicle.getById({ id });
    
    const title = `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name} for Hire`;
    const description = vehicle.description ?? `Browse details of this ${vehicle.year} ${vehicle.make.name} ${vehicle.model.name} available for hire.`;
    const primaryImage = vehicle.media.find((m) => m.isPrimary)?.publishedUrl ?? 
                         vehicle.media[0]?.publishedUrl ?? 
                         vehicle.media[0]?.originalUrl;
    
    const appUrl = getAppUrl();
    const canonicalUrl = `${appUrl}/vehicles/${id}`;

    return {
      title,
      description,
      keywords: [
        vehicle.make.name,
        vehicle.model.name,
        vehicle.year,
        "classic car hire",
        "vintage car rental",
        "wedding car",
        "special occasion vehicle",
      ],
      openGraph: {
        title,
        description,
        type: "website",
        url: canonicalUrl,
        siteName: "SpokeHire",
        images: primaryImage ? [
          {
            url: primaryImage,
            alt: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
          },
        ] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: primaryImage ? [primaryImage] : [],
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch {
    return {
      title: "Vehicle Not Found | SpokeHire",
      description: "The vehicle you're looking for is not available.",
    };
  }
}

/**
 * Public Vehicle Detail Page
 * 
 * Server Component that displays full vehicle details for public viewing.
 * Only PUBLISHED vehicles are accessible.
 * NO authentication required.
 */
export default async function PublicVehicleDetailPage({ params }: PageProps) {
  const { id } = await params;

  let vehicle;
  try {
    vehicle = await api.publicVehicle.getById({ id });
  } catch (error) {
    notFound();
  }

  // Double-check status (should be handled by API but adding extra safety)
  if (vehicle.status !== "PUBLISHED") {
    notFound();
  }

  // Generate JSON-LD structured data with BreadcrumbList
  const appUrl = getAppUrl();
  const primaryImage = vehicle.media.find((m) => m.isPrimary)?.publishedUrl ?? 
                       vehicle.media[0]?.publishedUrl ?? 
                       vehicle.media[0]?.originalUrl;
  
  // Build breadcrumb list for structured data
  const breadcrumbItems = [];
  
  // Always start with home
  breadcrumbItems.push({
    "@type": "ListItem",
    position: 1,
    name: "Home",
    item: appUrl,
  });
  
  // Add vehicles catalogue
  breadcrumbItems.push({
    "@type": "ListItem",
    position: 2,
    name: "Vehicles",
    item: `${appUrl}/vehicles`,
  });
  
  // Add location if available
  if (vehicle.owner.country) {
    const locationParts: string[] = [];
    if (vehicle.owner.city) locationParts.push(vehicle.owner.city);
    if (vehicle.owner.county) locationParts.push(vehicle.owner.county);
    if (locationParts.length === 0 && vehicle.owner.country) {
      locationParts.push(vehicle.owner.country.name);
    }
    const locationString = locationParts.join(", ");
    
    breadcrumbItems.push({
      "@type": "ListItem",
      position: 3,
      name: locationString || vehicle.owner.country.name,
      item: `${appUrl}/vehicles?countryIds=${vehicle.owner.country.id}`,
    });
  }
  
  // Add make
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: vehicle.make.name,
    item: `${appUrl}/vehicles?makeIds=${vehicle.make.id}`,
  });
  
  // Add model
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: vehicle.model.name,
    item: `${appUrl}/vehicles?makeIds=${vehicle.make.id}&modelId=${vehicle.model.id}`,
  });
  
  // Add current page
  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
    item: `${appUrl}/vehicles/${vehicle.id}`,
  });
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
    description: vehicle.description ?? `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name} available for hire`,
    brand: {
      "@type": "Brand",
      name: vehicle.make.name,
    },
    model: vehicle.model.name,
    image: primaryImage ? [primaryImage] : [],
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      url: `${appUrl}/vehicles/${vehicle.id}`,
    },
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Year",
        value: vehicle.year,
      },
      vehicle.engineCapacity ? {
        "@type": "PropertyValue",
        name: "Engine Capacity",
        value: `${vehicle.engineCapacity}cc`,
      } : null,
      vehicle.numberOfSeats ? {
        "@type": "PropertyValue",
        name: "Number of Seats",
        value: vehicle.numberOfSeats,
      } : null,
    ].filter(Boolean),
  };
  
  // BreadcrumbList structured data
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  // Fetch static blocks for vehicle page
  const staticBlocks = await getBlocksByPageSlug('vehicle-page');

  return (
    <>
      {/* Analytics Tracking */}
      <VehicleViewTracker
        vehicleId={vehicle.id}
        vehicleName={`${vehicle.make.name} ${vehicle.model.name}`}
        make={vehicle.make.name}
        model={vehicle.model.name}
        year={Number(vehicle.year)}
      />
      
      {/* JSON-LD Structured Data - Product */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* JSON-LD Structured Data - BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />

      <div className={LAYOUT_CONSTANTS.bgDefault}>
        {/* Vehicle Detail Header */}
        <VehicleDetailHeader vehicle={vehicle} />

      {/* Main Content */}
      <main className={cn(VEHICLE_DETAIL.containerPadding, "pt-5 md:pt-0")}>
        {/* Two-Column Layout - Desktop, Single Column - Mobile */}
        <div className={VEHICLE_DETAIL.detailGrid}>
          {/* Left Column - Media Gallery (890px width on desktop) */}
          <div className={VEHICLE_DETAIL.detailGridLeft}>
            <section aria-label="Vehicle gallery">
              <h2 className="sr-only">Gallery</h2>
              <PublicVehicleMediaSection vehicle={vehicle} />
            </section>
          </div>

          {/* Right Column - Details (flexible width on desktop) */}
          <div className={VEHICLE_DETAIL.detailGridRight}>
            <PublicVehicleBasicInfo vehicle={vehicle} />
          </div>
        </div>

        {/* Full-Width Description Section */}
        {vehicle.description && (
          <section 
            aria-label="Vehicle description" 
            className={cn(
              "w-full pt-4 md:pt-[41px]",
              "flex flex-col gap-3.5"
            )}
          >
            <h2 className={cn(TYPOGRAPHY.h3, "text-black uppercase tracking-[0.72px]")}>
              Description
            </h2>
            <p className={cn(TYPOGRAPHY.bodyMedium, "text-black whitespace-pre-line tracking-[-0.16px]")}>
              {vehicle.description}
            </p>
          </section>
        )}

        {/* Similar Vehicles Section */}
        <SimilarVehicles vehicleId={vehicle.id} />

      </main>

      {/* Static Blocks Section */}
      {staticBlocks.length > 0 && (
        <>
          {staticBlocks.map((staticBlock) => (
            <div key={staticBlock.id}>
              {staticBlock.layout && staticBlock.layout.length > 0 ? (
                staticBlock.layout.map((block, index) => (
                  <BlockRenderer
                    key={`${staticBlock.id}-${block.blockType}-${index}`}
                    block={block}
                    index={index}
                  />
                ))
              ) : null}
            </div>
          ))}
        </>
      )}
      </div>
    </>
  );
}

