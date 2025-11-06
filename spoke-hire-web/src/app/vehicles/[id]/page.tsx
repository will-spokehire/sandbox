import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";
import { db } from "~/server/db";
import { PublicVehicleMediaSection } from "./_components/PublicVehicleMediaSection";
import { PublicVehicleBasicInfo } from "./_components/PublicVehicleBasicInfo";
import { VehicleDetailBreadcrumbs } from "./_components/VehicleDetailBreadcrumbs";
import { getAppUrl } from "~/lib/app-url";
import { LAYOUT_CONSTANTS, TYPOGRAPHY } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";
import { StandardPageHeader } from "~/app/_components/layouts";

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
  
  // Add vehicles catalog
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

  return (
    <>
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
        {/* Header with Back Button */}
        <StandardPageHeader
          variant="detail"
          title={`${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`}
          backButton={
            <Link href="/vehicles">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Catalog
              </Button>
            </Link>
          }
        />

      {/* Main Content */}
      <main className={cn(LAYOUT_CONSTANTS.container, LAYOUT_CONSTANTS.pageSpacing)}>
        {/* Breadcrumbs */}
        <VehicleDetailBreadcrumbs vehicle={vehicle} />

        {/* Two-Column Layout */}
        <div className={LAYOUT_CONSTANTS.detailGrid}>
          {/* Left Column - Media Gallery & Description (2/3 width on desktop) */}
          <div className={LAYOUT_CONSTANTS.detailGridLeft}>
            <section aria-label="Vehicle gallery">
              <h2 className="sr-only">Gallery</h2>
              <PublicVehicleMediaSection vehicle={vehicle} />
            </section>

            {/* Description Section */}
            {vehicle.description && (
              <section aria-label="Vehicle description" className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className={TYPOGRAPHY.sectionTitle + " mb-4"}>Description</h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {vehicle.description}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Details (1/3 width on desktop) */}
          <div className={LAYOUT_CONSTANTS.detailGridRight}>
            {/* Make Enquiry Button - Prominent CTA at the top */}
            <section aria-label="Contact">
              <Link href={`/enquiry/new?vehicleId=${vehicle.id}`}>
                <Button className="w-full" size="lg">
                  Make Enquiry
                </Button>
              </Link>
            </section>

            <section aria-label="Vehicle specifications">
              <h2 className="sr-only">Specifications</h2>
              <PublicVehicleBasicInfo vehicle={vehicle} />
            </section>
          </div>
        </div>
      </main>
      </div>
    </>
  );
}

