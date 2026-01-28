/**
 * PayloadCMS API Client
 *
 * Provides functions to fetch content from the PayloadCMS REST API.
 * Used for static page generation and dynamic content fetching.
 */

// ============================================
// TYPES
// ============================================

export interface PayloadMedia {
  id: string
  url: string
  alt?: string
  width?: number
  height?: number
  filename?: string
  mimeType?: string
}

export interface PayloadIcon {
  id: string
  name: string
  svg: PayloadMedia
}

export interface SiteSettings {
  id: number
  siteName: string
  tagline?: string | null
  logo?: PayloadMedia | null
  favicon?: PayloadMedia | null
  seoDefaults?: {
    defaultMetaDescription?: string | null
    defaultOgImage?: PayloadMedia | null
  } | null
  analytics?: {
    googleAnalyticsId?: string | null
  } | null
  copyrightText?: string | null
  contactInfo?: {
    email?: string | null
    phone?: string | null
    address?: string | null
  } | null
  updatedAt?: string | null
  createdAt?: string | null
}

// ============================================
// MEDIA URL HELPER
// ============================================

/**
 * Get the base URL for PayloadCMS media files
 * Removes /api from the API URL to get the base CMS URL
 */
function getMediaBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000'
  // Remove trailing /api if present, then remove any trailing slashes
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '')
}

/**
 * Convert a relative PayloadCMS media URL to an absolute URL
 * PayloadCMS returns URLs like /api/media/file/image.jpg
 * We need to prefix them with the CMS base URL
 */
export function getMediaUrl(url: string | undefined): string {
  if (!url) return ''
  
  // If already absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Prefix with CMS base URL
  const baseUrl = getMediaBaseUrl()
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

export interface Stat {
  id: string
  label: string
  icon?: string | PayloadIcon
  status: 'draft' | 'published'
}

export interface ValueProp {
  id: string
  title: string
  description: string
  icon?: string | PayloadIcon
  status: 'draft' | 'published'
}

export interface Testimonial {
  id: string
  quote: string
  author: string
  role?: string
  rating?: number
  status: 'draft' | 'published'
}

export interface FAQ {
  id: string
  question: string
  answer: unknown // Lexical rich text
  status: 'draft' | 'published'
}

export interface CTABlockContent {
  id: string
  heading: string
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  description: string
  actions: Array<{
    label: string
    link: string
    style: 'primary' | 'secondary' | 'outline'
  }>
  status: 'draft' | 'published'
}

// Block Types
export interface StatsBarBlockData {
  blockType: 'stats-bar'
  title?: string
  displayStyle: 'badges' | 'cards' | 'minimal' | 'large'
  selectedStats: Stat[]
  hideOnMobile?: boolean
}

export interface ValuePropsBlockData {
  blockType: 'value-props-section'
  title: string
  subtitle?: string
  selectedProps: ValueProp[]
  displayStyle: 'grid' | 'list' | 'carousel'
  columns: '2' | '3' | '4' | 2 | 3 | 4
  hideOnMobile?: boolean
}

export interface TestimonialsSectionBlockData {
  blockType: 'testimonials-section'
  title?: string
  selectedTestimonials: Testimonial[]
  showRatings: boolean
  hideOnMobile?: boolean
}

export interface FAQSectionBlockData {
  blockType: 'faq-section'
  title?: string
  subtitle?: string | {
    root: {
      type: string
      children: {
        type: any
        version: number
        [k: string]: unknown
      }[]
      direction: ('ltr' | 'rtl') | null
      format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
      indent: number
      version: number
    }
    [k: string]: unknown
  }
  selectedFAQs: FAQ[]
  defaultExpanded: boolean
  hideOnMobile?: boolean
}

export interface RichTextContentBlockData {
  blockType: 'rich-text-content'
  header?: string
  headerType?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  content: unknown // Lexical rich text
  hideOnMobile?: boolean
}

export interface CallToActionBlockData {
  blockType: 'call-to-action-block'
  selectedCTA: CTABlockContent
  hideOnMobile?: boolean
}

export interface FeaturedVehiclesBlockData {
  blockType: 'featured-vehicles'
  title?: string
  subtitle?: string
  selectionType: 'manual' | 'latest'
  vehicleIds?: { vehicleId: string }[]
  limit?: number
  showMobileButton?: boolean
  hideOnMobile?: boolean
}

export interface CarouselImage {
  id: string
  desktopImage: PayloadMedia
  mobileImage?: PayloadMedia
  alt: string
  status: 'draft' | 'published'
}

export interface Spotlight {
  id: string
  image: PayloadMedia
  caption: string
  link?: string
  status: 'draft' | 'published'
}

export interface ImageCarouselBlockData {
  blockType: 'image-carousel'
  images: CarouselImage[]
  autoplay: boolean
  autoplayDelay: number
  hideOnMobile?: boolean
}

export interface SpacerBlockData {
  blockType: 'spacer'
  height: 'small' | 'medium' | 'large'
  hideOnMobile?: boolean
}

export interface SpotlightBlockData {
  blockType: 'project-spotlight'
  title?: string
  selectedSpotlights: Spotlight[]
  showArrows: boolean
  itemsPerView?: number
  hideOnMobile?: boolean
}

export interface NumberedListItem {
  number?: string
  heading: string
  description: string
}

export interface NumberedListBlockData {
  blockType: 'numbered-list'
  title: string
  items: NumberedListItem[]
  hideOnMobile?: boolean
}

export type PageBlock =
  | StatsBarBlockData
  | ValuePropsBlockData
  | TestimonialsSectionBlockData
  | FAQSectionBlockData
  | RichTextContentBlockData
  | CallToActionBlockData
  | FeaturedVehiclesBlockData
  | ImageCarouselBlockData
  | SpacerBlockData
  | SpotlightBlockData
  | NumberedListBlockData

export interface StaticPageSEO {
  metaTitle?: string
  metaDescription?: string
  ogTitle?: string
  ogDescription?: string
  ogImage?: PayloadMedia
  keywords?: { keyword: string }[]
}

export interface StaticPage {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  publishedAt?: string
  layout: PageBlock[]
  seo?: StaticPageSEO
  createdAt: string
  updatedAt: string
}

export interface StaticBlock {
  id: string | number
  name: string
  pageSlug: string
  order?: number | null
  status: 'draft' | 'published'
  layout: PageBlock[]
  createdAt: string
  updatedAt: string
}

interface PayloadResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

// ============================================
// API CLIENT
// ============================================

// PayloadCMS API URL - should point to the CMS server
// Format: "http://localhost:3001" (without /api) or "http://localhost:3001/api" (with /api)
// The code handles both formats
const PAYLOAD_API_URL_RAW = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000'

/**
 * Normalize the API base URL
 * Handles both formats: with or without trailing /api
 */
function getApiBaseUrl(): string {
  let url = PAYLOAD_API_URL_RAW.replace(/\/+$/, '') // Remove trailing slashes
  // If URL doesn't end with /api, add it
  if (!url.endsWith('/api')) {
    url = `${url}/api`
  }
  return url
}

const PAYLOAD_API_BASE = getApiBaseUrl()

/**
 * Fetch wrapper with error handling and cache tagging
 * All PayloadCMS API calls are tagged with 'cms-content' for broad cache invalidation
 */
async function payloadFetch<T>(
  endpoint: string,
  options?: RequestInit & {
    next?: {
      tags?: string[]
      revalidate?: number | false
    }
  }
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${PAYLOAD_API_BASE}${cleanEndpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Add cache tag for broad invalidation
      next: {
        tags: ['cms-content'],
        ...options?.next,
      },
    } as RequestInit)

    if (!response.ok) {
      throw new Error(`PayloadCMS API error: ${response.status} ${response.statusText}`)
    }

    return response.json() as Promise<T>
  } catch (error) {
    console.error(`[PayloadAPI] Error fetching ${endpoint}:`, error)
    throw error
  }
}

// ============================================
// STATIC PAGES API
// ============================================

/**
 * Get a static page by its slug
 */
export async function getPageBySlug(slug: string): Promise<StaticPage | null> {
  try {
    const response = await payloadFetch<PayloadResponse<StaticPage>>(
      `/static-pages?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&depth=3`
    )

    if (response.docs.length === 0) {
      return null
    }

    return response.docs[0] ?? null
  } catch (error) {
    console.error(`[PayloadAPI] Error fetching page with slug "${slug}":`, error)
    return null
  }
}

/**
 * Get all published static pages (for SSG)
 */
export async function getPublishedPages(): Promise<StaticPage[]> {
  try {
    const response = await payloadFetch<PayloadResponse<StaticPage>>(
      `/static-pages?where[status][equals]=published&depth=0&limit=100`
    )

    return response.docs
  } catch (error) {
    console.error('[PayloadAPI] Error fetching published pages:', error)
    return []
  }
}

/**
 * Get all page slugs (for generateStaticParams)
 */
export async function getPageSlugs(): Promise<string[]> {
  try {
    const pages = await getPublishedPages()
    return pages.map((page) => page.slug)
  } catch (error) {
    console.error('[PayloadAPI] Error fetching page slugs:', error)
    return []
  }
}

// ============================================
// STATIC BLOCKS API
// ============================================

/**
 * Get all static blocks for a specific page slug
 * Returns blocks sorted by order field (ascending)
 */
export async function getBlocksByPageSlug(pageSlug: string): Promise<StaticBlock[]> {
  try {
    const response = await payloadFetch<PayloadResponse<StaticBlock>>(
      `/static-blocks?where[pageSlug][equals]=${encodeURIComponent(pageSlug)}&where[status][equals]=published&sort=order&depth=3`
    )

    // Sort by order field (ascending) - API should handle this, but ensure it's sorted
    const blocks = response.docs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    return blocks
  } catch (error) {
    console.error(`[PayloadAPI] Error fetching blocks with pageSlug "${pageSlug}":`, error)
    return []
  }
}

// ============================================
// CONTENT COLLECTIONS API (for block data)
// ============================================

/**
 * Get testimonials by IDs
 */
export async function getTestimonialsByIds(ids: string[]): Promise<Testimonial[]> {
  try {
    const idsParam = ids.map((id) => `where[id][in]=${id}`).join('&')
    const response = await payloadFetch<PayloadResponse<Testimonial>>(
      `/testimonials?${idsParam}&where[status][equals]=published&depth=1`
    )
    return response.docs
  } catch (error) {
    console.error('[PayloadAPI] Error fetching testimonials by IDs:', error)
    return []
  }
}

/**
 * Get stats by IDs
 */
export async function getStatsByIds(ids: string[]): Promise<Stat[]> {
  try {
    const idsParam = ids.map((id) => `where[id][in]=${id}`).join('&')
    const response = await payloadFetch<PayloadResponse<Stat>>(
      `/stats?${idsParam}&where[status][equals]=published&depth=2`
    )
    return response.docs
  } catch (error) {
    console.error('[PayloadAPI] Error fetching stats by IDs:', error)
    return []
  }
}

/**
 * Get value props by IDs
 */
export async function getValuePropsByIds(ids: string[]): Promise<ValueProp[]> {
  try {
    const idsParam = ids.map((id) => `where[id][in]=${id}`).join('&')
    const response = await payloadFetch<PayloadResponse<ValueProp>>(
      `/value-props?${idsParam}&where[status][equals]=published&depth=2`
    )
    return response.docs
  } catch (error) {
    console.error('[PayloadAPI] Error fetching value props by IDs:', error)
    return []
  }
}

// ============================================
// NAVIGATION GLOBAL API
// ============================================

export interface NavigationFooterColumn {
  id?: string | null
  title?: string | null
  type?: 'links' | 'contact' | null
  links?: {
    id?: string | null
    label: string
    url: string
  }[] | null
  contactInfo?: {
    addressLabel?: string | null
    addressValue?: string | null
    emailLabel?: string | null
    emailValue?: string | null
  } | null
}

export interface NavigationSocialLink {
  id?: string | null
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin'
  url: string
  icon?: string | null
}

export interface NavigationFooterSettings {
  copyrightText?: string | null
  privacyPolicyUrl?: string | null
  termsOfServiceUrl?: string | null
  showLargeLogo?: boolean | null
}

export interface Navigation {
  id: number
  mainMenu?: {
    id?: string | null
    label: string
    link: string
    children?: {
      id?: string | null
      label: string
      link: string
    }[] | null
    icon?: string | null
  }[] | null
  footerColumns?: NavigationFooterColumn[] | null
  socialLinks?: NavigationSocialLink[] | null
  footerSettings?: NavigationFooterSettings | null
  updatedAt?: string | null
  createdAt?: string | null
}

/**
 * Get Navigation global settings
 * Includes main menu, footer columns, social links, and footer settings
 */
export async function getNavigation(): Promise<Navigation | null> {
  try {
    const response = await payloadFetch<Navigation>(
      '/globals/navigation?depth=2'
    )
    return response
  } catch (error) {
    console.error('[PayloadAPI] Error fetching Navigation global:', error)
    return null
  }
}

/**
 * Get Site Settings global
 * Includes site name, logo, tagline, SEO defaults, and contact information
 */
export async function getSiteSettings(): Promise<SiteSettings | null> {
  try {
    const response = await payloadFetch<SiteSettings>(
      '/globals/site-settings?depth=2'
    )
    return response
  } catch (error) {
    console.error('[PayloadAPI] Error fetching Site Settings global:', error)
    return null
  }
}

