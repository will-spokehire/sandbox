/**
 * SEO Utilities
 *
 * Helper functions and constants for SEO metadata generation.
 * Re-exports getSiteSettings from payload-api for convenience.
 */

import { getSiteSettings, getMediaUrl, type SiteSettings } from './payload-api'

// Re-export for convenience
export { getSiteSettings, getMediaUrl, type SiteSettings }

/**
 * Get default OG image URL from SiteSettings
 */
export function getDefaultOgImage(siteSettings: SiteSettings | null): string | undefined {
  const url = siteSettings?.seoDefaults?.defaultOgImage?.url
  return url ? getMediaUrl(url) : undefined
}

/**
 * Get default meta description from SiteSettings
 */
export function getDefaultDescription(siteSettings: SiteSettings | null): string | undefined {
  return siteSettings?.seoDefaults?.defaultMetaDescription ?? undefined
}

/**
 * Get favicon URL from SiteSettings
 */
export function getFaviconUrl(siteSettings: SiteSettings | null): string {
  const url = siteSettings?.favicon?.url
  return url ? getMediaUrl(url) : '/favicon.ico'
}

/**
 * Get logo URL from SiteSettings (used for Apple touch icon)
 */
export function getLogoUrl(siteSettings: SiteSettings | null): string {
  const url = siteSettings?.logo?.url
  return url ? getMediaUrl(url) : '/spoke-hire-logo-1.png'
}

/**
 * Hardcoded SEO constants
 * Used as fallbacks when CMS values are not available
 */
export const SEO_CONSTANTS = {
  siteName: 'SpokeHire',
  defaultTitle: 'SpokeHire - Classic & Vintage Vehicle Hire',
  defaultDescription:
    "Discover the UK's largest collection of classic and vintage vehicles available for hire.",
  twitterHandle: '@spokehire',
  themeColor: '#000000',
  backgroundColor: '#ffffff',
} as const
