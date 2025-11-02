import { use } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/server";
import { PublicVehicleMediaSection } from "./_components/PublicVehicleMediaSection";
import { PublicVehicleBasicInfo } from "./_components/PublicVehicleBasicInfo";
import { VehicleDetailBreadcrumbs } from "./_components/VehicleDetailBreadcrumbs";
import { getAppUrl } from "~/lib/app-url";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
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

  // Generate JSON-LD structured data
  const appUrl = getAppUrl();
  const primaryImage = vehicle.media.find((m) => m.isPrimary)?.publishedUrl ?? 
                       vehicle.media[0]?.publishedUrl ?? 
                       vehicle.media[0]?.originalUrl;
  
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

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-background">
        {/* Back Navigation */}
        <div className="border-b bg-slate-50 dark:bg-slate-900">
          <div className="container mx-auto px-4 py-4">
            <Link href="/vehicles">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Catalog
              </Button>
            </Link>
          </div>
        </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
        {/* Breadcrumbs */}
        <VehicleDetailBreadcrumbs vehicle={vehicle} />

        {/* Vehicle Title */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            {vehicle.year} {vehicle.make.name} {vehicle.model.name}
          </h1>
        </header>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Media Gallery & Description (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            <section aria-label="Vehicle gallery">
              <h2 className="sr-only">Gallery</h2>
              <PublicVehicleMediaSection vehicle={vehicle} />
            </section>

            {/* Description Section */}
            {vehicle.description && (
              <section aria-label="Vehicle description" className="prose prose-slate dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold mb-4">Description</h2>
                <div className="text-muted-foreground whitespace-pre-line leading-relaxed">
                  {vehicle.description}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Details (1/3 width on desktop) */}
          <div className="lg:col-span-1">
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

