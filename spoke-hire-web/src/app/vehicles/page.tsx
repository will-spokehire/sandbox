import type { Metadata } from "next";
import { PublicVehicleFiltersProvider } from "~/contexts/PublicVehicleFiltersContext";
import PublicVehiclesPageContent from "./page-content";
import { getAppUrl } from "~/lib/app-url";

/**
 * SEO Metadata for Public Vehicles Catalog
 */
export const metadata: Metadata = {
  title: "Browse Classic & Vintage Vehicles for Hire | SpokeHire",
  description: "Discover our collection of meticulously maintained classic and vintage vehicles available for hire. From elegant classic cars to timeless vintage models, find the perfect vehicle for your special occasion.",
  keywords: ["classic cars", "vintage vehicles", "car hire", "classic car rental", "vintage car hire", "wedding cars", "special occasion vehicles"],
  openGraph: {
    title: "Browse Classic & Vintage Vehicles for Hire",
    description: "Discover our collection of classic and vintage vehicles available for hire for your special occasions.",
    type: "website",
    siteName: "SpokeHire",
  },
  twitter: {
    card: "summary_large_image",
    title: "Browse Classic & Vintage Vehicles for Hire | SpokeHire",
    description: "Discover our collection of classic and vintage vehicles available for hire.",
  },
  alternates: {
    canonical: "/vehicles",
  },
};

/**
 * Public Vehicles Catalog Page
 * 
 * Server Component that sets SEO metadata and wraps the content.
 * Accessible without authentication.
 */
export default function PublicVehiclesPage() {
  const appUrl = getAppUrl();
  
  // Generate JSON-LD structured data for catalog page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Classic & Vintage Vehicles for Hire",
    description: "Browse our collection of classic and vintage vehicles available for hire",
    url: `${appUrl}/vehicles`,
    isPartOf: {
      "@type": "WebSite",
      name: "SpokeHire",
      url: appUrl,
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <PublicVehicleFiltersProvider>
        <PublicVehiclesPageContent />
      </PublicVehicleFiltersProvider>
    </>
  );
}
