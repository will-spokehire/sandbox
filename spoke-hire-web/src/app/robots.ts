import type { MetadataRoute } from "next";
import { getAppUrl } from "~/lib/app-url";

/**
 * Robots.txt Configuration
 * 
 * Tells search engines which pages to crawl and which to avoid.
 * References the dynamic sitemap for efficient crawling.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getAppUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/", // Home page
          "/vehicles", // Public vehicle catalogue
          "/vehicles/", // All vehicle detail pages
        ],
        disallow: [
          "/admin", // Block admin interface
          "/admin/*", // Block all admin routes
          "/user", // Block user dashboard
          "/user/*", // Block all user routes
          "/api", // Block API routes
          "/api/*", // Block all API endpoints
          "/_next", // Block Next.js internals
          "/trpc", // Block tRPC endpoints
        ],
      },
      {
        // Special rule for Google
        userAgent: "Googlebot",
        allow: ["/", "/vehicles", "/vehicles/"],
        disallow: ["/admin", "/user", "/api", "/_next", "/trpc"],
      },
      {
        // Special rule for Bing
        userAgent: "Bingbot",
        allow: ["/", "/vehicles", "/vehicles/"],
        disallow: ["/admin", "/user", "/api", "/_next", "/trpc"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

