import type { Metadata } from "next";
import { PublicVehicleFiltersProvider } from "~/contexts/PublicVehicleFiltersContext";
import PublicVehiclesPageContent from "./page-content";
import { getAppUrl } from "~/lib/app-url";
import { api } from "~/trpc/server";

interface PageProps {
  searchParams: Promise<{
    makeIds?: string;
    modelId?: string;
    collectionIds?: string;
    yearFrom?: string;
    yearTo?: string;
    countryIds?: string;
    counties?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

/**
 * Generate dynamic metadata based on filters
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const appUrl = getAppUrl();
  
  // Build dynamic title based on filters
  let title = "Browse Classic & Vintage Vehicles for Hire | SpokeHire";
  let description = "Discover our collection of meticulously maintained classic and vintage vehicles available for hire.";
  
  // Get filter options to build more specific titles
  const makeIds = params.makeIds?.split(",").filter(Boolean);
  const countryIds = params.countryIds?.split(",").filter(Boolean);
  
  if (makeIds && makeIds.length > 0) {
    try {
      const filterOptions = await api.publicVehicle.getFilterOptions({
        makeIds,
        countryIds,
      });
      
      const makes = filterOptions.makes?.filter(m => makeIds.includes(m.id)) ?? [];
      const makeNames = makes.map(m => m.name);
      
      if (makeNames.length > 0) {
        const countries = filterOptions.countries?.filter(c => countryIds?.includes(c.id)) ?? [];
        const location = countries.length > 0 ? ` in ${countries.map(c => c.name).join(", ")}` : "";
        title = `${makeNames.join(" & ")} for Hire${location} | SpokeHire`;
        description = `Browse our collection of ${makeNames.join(" & ")} vehicles available for hire${location}.`;
      }
    } catch (error) {
      // Fallback to default if filter options fail
      console.error("Failed to fetch filter options for metadata:", error);
    }
  }

  return {
    title,
    description,
    keywords: ["classic cars", "vintage vehicles", "car hire", "classic car rental", "vintage car hire", "wedding cars", "special occasion vehicles"],
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "SpokeHire",
      url: `${appUrl}/vehicles`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: "/vehicles",
    },
  };
}

/**
 * Public Vehicles Catalogue Page (Server-Side Rendered)
 * 
 * Server Component that fetches initial data server-side for SEO.
 * Accessible without authentication.
 */
export default async function PublicVehiclesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const appUrl = getAppUrl();
  
  // Parse filter parameters from URL
  const makeIds = params.makeIds?.split(",").filter(Boolean);
  const collectionIds = params.collectionIds?.split(",").filter(Boolean);
  const countryIds = params.countryIds?.split(",").filter(Boolean);
  const counties = params.counties?.split(",").filter(Boolean);
  const page = params.page ? parseInt(params.page, 10) : 1;
  const itemsPerPage = 40;
  const skip = (page - 1) * itemsPerPage;

  // Fetch initial data and filter options server-side in parallel
  let initialData;
  let filterOptions;
  
  try {
    [initialData, filterOptions] = await Promise.all([
      api.publicVehicle.list({
        limit: itemsPerPage,
        skip,
        makeIds: makeIds && makeIds.length > 0 ? makeIds : undefined,
        modelId: params.modelId,
        collectionIds: collectionIds && collectionIds.length > 0 ? collectionIds : undefined,
        yearFrom: params.yearFrom,
        yearTo: params.yearTo,
        countryIds: countryIds && countryIds.length > 0 ? countryIds : undefined,
        counties: counties && counties.length > 0 ? counties : undefined,
        sortBy: (params.sortBy as "name" | "createdAt" | "updatedAt" | "year" | "distance") ?? "createdAt",
        sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
        includeTotalCount: true,
      }),
      // Fetch filter options if there are active filters
      (makeIds?.length || params.modelId || collectionIds?.length || params.yearFrom || countryIds?.length || counties?.length)
        ? api.publicVehicle.getFilterOptions({
            makeIds,
            modelId: params.modelId,
            collectionIds,
            yearFrom: params.yearFrom,
            yearTo: params.yearTo,
            countryIds,
            counties,
          })
        : null,
    ]);
  } catch (error) {
    console.error("Failed to fetch initial vehicles:", error);
    // Provide empty initial data on error
    initialData = {
      vehicles: [],
      items: [],
      nextCursor: undefined,
      totalCount: 0 as number,
    };
    filterOptions = null;
  }

  // Generate H1 and H2 titles server-side
  const titles = generatePageTitles({
    makeIds,
    modelId: params.modelId,
    collectionIds,
    yearFrom: params.yearFrom,
    countryIds,
    counties,
  }, filterOptions);

  // Generate JSON-LD structured data for catalogue page with ItemList
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: titles.h1,
    description: titles.h2,
    url: `${appUrl}/vehicles`,
    isPartOf: {
      "@type": "WebSite",
      name: "SpokeHire",
      url: appUrl,
    },
    // Add ItemList for top vehicles
    mainEntity: initialData.vehicles.length > 0 ? {
      "@type": "ItemList",
      itemListElement: initialData.vehicles.slice(0, 10).map((vehicle: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: `${vehicle.year} ${vehicle.make.name} ${vehicle.model.name}`,
          url: `${appUrl}/vehicles/${vehicle.id}`,
          image: vehicle.media[0]?.publishedUrl ?? vehicle.media[0]?.originalUrl,
        },
      })),
    } : undefined,
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <PublicVehicleFiltersProvider>
        <PublicVehiclesPageContent 
          initialData={initialData} 
          serverTitles={titles}
          serverFilterOptions={filterOptions}
        />
      </PublicVehicleFiltersProvider>
    </>
  );
}

/**
 * Generate page titles server-side based on filters
 */
function generatePageTitles(
  filters: {
    makeIds?: string[];
    modelId?: string;
    collectionIds?: string[];
    yearFrom?: string;
    countryIds?: string[];
    counties?: string[];
  },
  filterOptions: any
) {
  let h1 = "";
  let h2 = "";

  // ========================================
  // H1: Geography + Cars + "for Hire"
  // ========================================
  const h1Parts: string[] = [];

  // 1. Vehicle/Make/Model info
  if (filters.makeIds && filters.makeIds.length > 0 && filterOptions?.makes) {
    const makes = filterOptions.makes.filter((m: any) => filters.makeIds?.includes(m.id));
    const makeNames = makes.map((m: any) => m.name);
    
    if (makeNames.length > 0) {
      if (filters.modelId && filterOptions?.models) {
        // Make + Model
        const model = filterOptions.models.find((m: any) => m.id === filters.modelId);
        if (model) {
          h1Parts.push(`${makeNames.join(" & ")} ${model.name}`);
        } else {
          h1Parts.push(makeNames.join(" & "));
        }
      } else {
        // Just Make(s)
        h1Parts.push(makeNames.join(" & "));
      }
    }
  } else {
    // No specific make - use generic
    h1Parts.push("Classic Vehicles");
  }

  // 2. Add "for Hire"
  h1Parts.push("for Hire");

  // 3. Add Location (Geography)
  const locationParts: string[] = [];
  
  if (filters.counties && filters.counties.length > 0) {
    locationParts.push(filters.counties.join(", "));
  }
  
  if (filters.countryIds && filters.countryIds.length > 0 && filterOptions?.countries) {
    const countries = filterOptions.countries.filter((c: any) => filters.countryIds?.includes(c.id));
    const countryNames = countries.map((c: any) => c.name);
    if (countryNames.length > 0) {
      locationParts.push(countryNames.join(", "));
    }
  }

  if (locationParts.length > 0) {
    h1Parts.push(`in ${locationParts.join(", ")}`);
  }

  h1 = h1Parts.join(" ");

  // ========================================
  // H2: SEO-friendly subtitle/description
  // ========================================
  const collectionNames: string[] = [];
  let hasDecade = false;

  // 1. Collections/Tags
  if (filters.collectionIds && filters.collectionIds.length > 0 && filterOptions?.collections) {
    const collections = filterOptions.collections.filter((c: any) => filters.collectionIds?.includes(c.id));
    collectionNames.push(...collections.map((c: any) => c.name));
  }

  // 2. Decade
  if (filters.yearFrom) {
    hasDecade = true;
  }

  // Build H2 based on what filters are active
  if (collectionNames.length > 0 && hasDecade) {
    h2 = `Explore our ${collectionNames.join(" & ")} vehicles from the ${filters.yearFrom}s`;
  } else if (collectionNames.length > 0) {
    h2 = `Browse our ${collectionNames.join(" & ")} vehicles`;
  } else if (hasDecade) {
    h2 = `Discover vintage vehicles from the ${filters.yearFrom}s`;
  } else if (filters.makeIds && filters.makeIds.length > 0 && filterOptions?.makes) {
    const makes = filterOptions.makes.filter((m: any) => filters.makeIds?.includes(m.id));
    const makeNames = makes.map((m: any) => m.name);
    if (makeNames.length > 0) {
      if (filters.modelId && filterOptions?.models) {
        const model = filterOptions.models.find((m: any) => m.id === filters.modelId);
        h2 = `Premium ${makeNames.join(" & ")} ${model?.name ?? ''} available for your special occasion`;
      } else if (makeNames.length === 1) {
        h2 = `Discover our collection of ${makeNames[0]} vehicles`;
      } else {
        h2 = `Premium ${makeNames.join(" & ")} vehicles available`;
      }
    } else {
      h2 = "Discover meticulously maintained classic and vintage vehicles";
    }
  } else if (locationParts.length > 0) {
    h2 = "Classic and vintage vehicles available in your area";
  } else {
    h2 = "Discover meticulously maintained classic and vintage vehicles for your special occasions";
  }

  return { h1, h2 };
}
