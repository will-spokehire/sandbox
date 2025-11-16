import type { MetadataRoute } from "next";
import { db } from "~/server/db";
import { getAppUrl } from "~/lib/app-url";

/**
 * Dynamic Sitemap Generator
 * 
 * Generates XML sitemap for search engines with:
 * - All published vehicle pages
 * - Vehicle catalogue page
 * - Popular filter combinations
 * 
 * Auto-updates as vehicles are published/unpublished
 * 
 * Note: This is generated dynamically at runtime (not at build time)
 * to ensure it's always up-to-date with the latest vehicles
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();
  const currentDate = new Date().toISOString();

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. Home page
  sitemapEntries.push({
    url: baseUrl,
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 1.0,
  });

  // 2. Vehicle catalogue page (main listing)
  sitemapEntries.push({
    url: `${baseUrl}/vehicles`,
    lastModified: currentDate,
    changeFrequency: "hourly",
    priority: 0.9,
  });

  try {
    // 3. Fetch all published vehicles for individual pages using Prisma directly
    const vehicles = await db.vehicle.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 1000, // Adjust if needed
    });

    // Add individual vehicle pages
    for (const vehicle of vehicles) {
      sitemapEntries.push({
        url: `${baseUrl}/vehicles/${vehicle.id}`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    // 4. Fetch filter options using Prisma directly
    const [makes, collections, countries] = await Promise.all([
      db.make.findMany({
        where: {
          vehicles: {
            some: {
              status: "PUBLISHED",
            },
          },
        },
        select: {
          id: true,
        },
        take: 10,
      }),
      db.collection.findMany({
        select: {
          id: true,
        },
      }),
      db.country.findMany({
        select: {
          id: true,
        },
        take: 5,
      }),
    ]);

    // Add catalogue pages filtered by make (top makes)
    for (const make of makes) {
      sitemapEntries.push({
        url: `${baseUrl}/vehicles?makeIds=${make.id}`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    // Add catalogue pages filtered by collection
    for (const collection of collections) {
      sitemapEntries.push({
        url: `${baseUrl}/vehicles?collectionIds=${collection.id}`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.7,
      });
    }

    // Add catalogue pages filtered by country (top countries)
    for (const country of countries) {
      sitemapEntries.push({
        url: `${baseUrl}/vehicles?countryIds=${country.id}`,
        lastModified: currentDate,
        changeFrequency: "daily",
        priority: 0.6,
      });

      // Combine country with top makes for more specific pages
      for (const make of makes.slice(0, 3)) {
        sitemapEntries.push({
          url: `${baseUrl}/vehicles?countryIds=${country.id}&makeIds=${make.id}`,
          lastModified: currentDate,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }
    }

    console.log(`✅ Generated sitemap with ${sitemapEntries.length} entries`);
  } catch (error) {
    console.error("Failed to generate complete sitemap:", error);
    // Return at least the base pages even if vehicle fetching fails
  }

  return sitemapEntries;
}

