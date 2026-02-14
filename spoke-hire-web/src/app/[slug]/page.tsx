import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPageBySlug, getPageSlugs, getMediaUrl } from '~/lib/payload-api'
import { BlockRenderer } from '~/components/blocks'
import { LAYOUT_CONSTANTS } from '~/lib/design-tokens'
import {
  getSiteSettings,
  getDefaultOgImage,
  getDefaultDescription,
  SEO_CONSTANTS,
} from '~/lib/seo'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

/**
 * Reserved slugs that should not be handled by this dynamic route.
 * These are handled by other routes in the app.
 */
const RESERVED_SLUGS = [
  'admin',
  'auth',
  'api',
  'dashboard',
  'user',
  'vehicles',
  'enquiry',
  'home', // Handled by root page.tsx at /
]

/**
 * File extensions that indicate a static asset request, not a page slug.
 * These should return 404 to let Next.js handle them as static files.
 */
const STATIC_FILE_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.svg',
  '.webp',
  '.ico',
  '.css',
  '.js',
  '.json',
  '.xml',
  '.txt',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]

/**
 * Check if a slug looks like a static file request
 */
function isStaticFileRequest(slug: string): boolean {
  const lowerSlug = slug.toLowerCase()
  return STATIC_FILE_EXTENSIONS.some((ext) => lowerSlug.endsWith(ext))
}

/**
 * Generate static params for all published pages
 * This enables Static Site Generation (SSG) for all CMS pages
 */
export async function generateStaticParams() {
  try {
    const slugs = await getPageSlugs()
    // Filter out reserved slugs
    return slugs
      .filter((slug) => !RESERVED_SLUGS.includes(slug))
      .map((slug) => ({ slug }))
  } catch (error) {
    console.error('[StaticPage] Error generating static params:', error)
    return []
  }
}

/**
 * Generate metadata for SEO
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  // Skip reserved slugs and static file requests
  if (RESERVED_SLUGS.includes(slug) || isStaticFileRequest(slug)) {
    return {}
  }

  // Fetch page and site settings in parallel
  const [page, siteSettings] = await Promise.all([
    getPageBySlug(slug),
    getSiteSettings(),
  ])

  if (!page) {
    return {
      title: 'Page Not Found | SpokeHire',
    }
  }

  const seo = page.seo ?? {}
  const title = seo.metaTitle ?? `${page.title} | SpokeHire`
  const description =
    seo.metaDescription ??
    getDefaultDescription(siteSettings) ??
    SEO_CONSTANTS.defaultDescription

  // Get OG image with fallback to site settings
  const ogImageUrl = seo.ogImage?.url
    ? getMediaUrl(seo.ogImage.url)
    : getDefaultOgImage(siteSettings)

  return {
    title,
    description,
    openGraph: {
      title: seo.ogTitle ?? title,
      description: seo.ogDescription ?? description,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
      type: 'website',
      siteName: SEO_CONSTANTS.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.ogTitle ?? title,
      description: seo.ogDescription ?? description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    keywords: seo.keywords?.map((k) => k.keyword).join(', ') ?? undefined,
  }
}

/**
 * Dynamic Page Component
 *
 * Renders static pages created in PayloadCMS using the page builder.
 * Each page consists of a layout array of blocks that are rendered
 * using the BlockRenderer component.
 */
export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params

  // Skip reserved slugs and static file requests - let Next.js handle them
  if (RESERVED_SLUGS.includes(slug) || isStaticFileRequest(slug)) {
    notFound()
  }

  const page = await getPageBySlug(slug)

  if (!page) {
    notFound()
  }

  return (
    <main className={LAYOUT_CONSTANTS.mainContent}>
      {/* Page Title (optional - can be removed if hero includes title) */}
      {/* <header className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold">{page.title}</h1>
        </div>
      </header> */}

      {/* Render all blocks in the layout */}
      {page.layout && page.layout.length > 0 ? (
        page.layout.map((block, index) => (
          <BlockRenderer key={`${block.blockType}-${index}`} block={block} index={index} isFirstBlock={index === 0} />
        ))
      ) : (
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">This page has no content yet.</p>
        </div>
      )}
    </main>
  )
}

