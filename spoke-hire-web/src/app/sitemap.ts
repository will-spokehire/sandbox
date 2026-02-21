import type { MetadataRoute } from "next";
import { db } from "~/server/db";
import { getAppUrl } from "~/lib/app-url";
import { getPublishedPages } from "~/lib/payload-api";

/**
 * Dynamic Sitemap Generator
 *
 * Generates XML sitemap for search engines with:
 * - All published vehicle pages (with real lastModified dates)
 * - Vehicle catalogue page
 * - CMS static pages
 *
 * Query-string filter URLs are intentionally excluded — they contain
 * unescaped '&' characters that produce invalid XML, and Google ignores
 * query-string URLs in sitemaps anyway.
 *
 * Auto-updates as vehicles are published/unpublished.
 *
 * Note: This is generated dynamically at runtime (not at build time)
 * to ensure it's always up-to-date with the latest vehicles
 */
export const dynamic = 'force-dynamic';

/** Ensure URLs are safe for XML by encoding any unescaped ampersands. */
function sanitizeUrl(url: string): string {
  // Replace bare & that are not already part of an XML entity (e.g. &amp;)
  return url.replace(/&(?!(?:amp|lt|gt|quot|apos);)/g, "&amp;");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();
  const currentDate = new Date().toISOString();

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // 1. Home page
  sitemapEntries.push({
    url: sanitizeUrl(baseUrl),
    lastModified: currentDate,
    changeFrequency: "daily",
    priority: 1.0,
  });

  // 2. Vehicle catalogue page (main listing)
  sitemapEntries.push({
    url: sanitizeUrl(`${baseUrl}/vehicles`),
    lastModified: currentDate,
    changeFrequency: "hourly",
    priority: 0.9,
  });

  try {
    // 3. Fetch all published vehicles with real updatedAt timestamps
    const vehicles = await db.vehicle.findMany({
      where: {
        status: "PUBLISHED",
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 1000,
    });

    // Add individual vehicle pages using real last-modified dates
    for (const vehicle of vehicles) {
      sitemapEntries.push({
        url: sanitizeUrl(`${baseUrl}/vehicles/${vehicle.id}`),
        lastModified: vehicle.updatedAt.toISOString(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    console.log(`✅ Generated vehicle sitemap entries: ${sitemapEntries.length}`);
  } catch (error) {
    console.error("Failed to generate vehicle sitemap entries:", error);
    // Continue to add CMS pages even if vehicle fetching fails
  }

  // 4. Add CMS static pages
  try {
    const pages = await getPublishedPages();
    for (const page of pages) {
      // Skip 'home' as it's handled by the root URL
      if (page.slug !== "home") {
        sitemapEntries.push({
          url: sanitizeUrl(`${baseUrl}/${page.slug}`),
          lastModified: page.updatedAt,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    }
    console.log(`✅ Added ${pages.filter((p) => p.slug !== "home").length} CMS pages to sitemap`);
  } catch (error) {
    console.error("Failed to fetch CMS pages for sitemap:", error);
    // Continue without CMS pages if fetching fails
  }

  console.log(`✅ Total sitemap entries: ${sitemapEntries.length}`);

  return sitemapEntries;
}

