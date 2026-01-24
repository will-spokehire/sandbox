import type { MetadataRoute } from "next";

/**
 * PWA Web App Manifest
 *
 * Defines how the app appears when installed on a user's device.
 * Uses hardcoded values for consistency.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpokeHire - Classic & Vintage Vehicle Hire",
    short_name: "SpokeHire",
    description: "Classic and vintage vehicle hire platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/spoke-hire-logo-1.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
