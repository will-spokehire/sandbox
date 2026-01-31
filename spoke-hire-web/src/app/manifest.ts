import type { MetadataRoute } from "next";
import { getSiteSettings, getLogoUrl, getFaviconUrl } from "~/lib/seo";

/**
 * PWA Web App Manifest
 *
 * Defines how the app appears when installed on a user's device.
 * Fetches logo URLs from CMS Site Settings for consistency with the rest of the site.
 * Falls back to /public/ files if CMS logos are not set.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  // Fetch site settings from CMS to get logo URLs
  const siteSettings = await getSiteSettings();
  
  // Get logo and favicon URLs (with automatic fallbacks to /public/ files)
  const logoUrl = getLogoUrl(siteSettings);
  const faviconUrl = getFaviconUrl(siteSettings);
  
  return {
    name: "SpokeHire - Classic & Vintage Vehicle Hire",
    short_name: "SpokeHire",
    description: "Classic and vintage vehicle hire platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: faviconUrl, sizes: "any", type: "image/x-icon" },
      { src: logoUrl, sizes: "192x192", type: "image/png" },
      { src: logoUrl, sizes: "512x512", type: "image/png" },
    ],
  };
}
