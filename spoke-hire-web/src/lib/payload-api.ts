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

// ============================================
// MEDIA URL HELPER
// ============================================

/**
 * Get the base URL for PayloadCMS media files
 * Removes /api from the API URL to get the base CMS URL
 */
function getMediaBaseUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_URL || 'http://localhost:3000'
  // Remove trailing /api if present
  return apiUrl.replace(/\/api\/?$/, '')
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

export interface HeroSlide {
  id: string
  image: PayloadMedia
  heading: string
  subheading?: string
  ctaText?: string
  ctaLink?: string
  order: number
  status: 'draft' | 'published'
}

export interface Stat {
  id: string
  label: string
  value: string
  icon?: string
  order: number
  status: 'draft' | 'published'
}

export interface ValueProp {
  id: string
  title: string
  description: string
  icon?: string
  order: number
  status: 'draft' | 'published'
}

export interface Testimonial {
  id: string
  quote: string
  author: string
  role?: string
  rating?: number
  image?: PayloadMedia
  category?: string
  featured: boolean
  order: number
  status: 'draft' | 'published'
}

export interface FAQ {
  id: string
  question: string
  answer: unknown // Lexical rich text
  category?: string
  order: number
  featured: boolean
  status: 'draft' | 'published'
}

export interface CTABlockContent {
  id: string
  heading: string
  description: string
  actions: Array<{
    label: string
    link: string
    style: 'primary' | 'secondary' | 'outline'
  }>
  backgroundStyle: 'primary' | 'secondary' | 'accent'
  status: 'draft' | 'published'
}

// Block Types
export interface HeroCarouselBlockData {
  blockType: 'hero-carousel'
  title?: string
  slides: HeroSlide[]
  autoplay: boolean
  autoplayDelay: number
  showArrows: boolean
  showDots: boolean
}

export interface StatsBarBlockData {
  blockType: 'stats-bar'
  title?: string
  displayStyle: 'badges' | 'cards' | 'minimal' | 'large'
  selectedStats: Stat[]
  columns: '2' | '3' | '4' | 2 | 3 | 4
  backgroundColor: 'default' | 'muted' | 'accent' | 'primary'
}

export interface ValuePropsBlockData {
  blockType: 'value-props-section'
  title: string
  subtitle?: string
  selectedProps: ValueProp[]
  displayStyle: 'grid' | 'list' | 'carousel'
  columns: '2' | '3' | '4' | 2 | 3 | 4
}

export interface TestimonialsSectionBlockData {
  blockType: 'testimonials-section'
  title?: string
  subtitle?: string
  selectedTestimonials: Testimonial[]
  displayStyle: 'carousel' | 'grid' | 'masonry'
  showRatings: boolean
  showImages: boolean
  itemsPerView: number
}

export interface FAQSectionBlockData {
  blockType: 'faq-section'
  title?: string
  subtitle?: string
  filterBy: 'manual' | 'category' | 'featured'
  selectedFAQs?: FAQ[]
  category?: string
  limit?: number
  displayStyle: 'accordion' | 'two-column' | 'list'
  defaultExpanded: boolean
}

export interface RichTextContentBlockData {
  blockType: 'rich-text-content'
  content: unknown // Lexical rich text
  maxWidth: 'narrow' | 'default' | 'wide' | 'full'
  backgroundColor: 'white' | 'muted' | 'accent'
}

export interface CallToActionBlockData {
  blockType: 'call-to-action-block'
  selectedCTA: CTABlockContent
}

export interface FeaturedVehiclesBlockData {
  blockType: 'featured-vehicles'
  title?: string
  subtitle?: string
  selectionType: 'manual' | 'latest'
  vehicleIds?: { vehicleId: string }[]
  limit?: number
  displayStyle: 'grid' | 'carousel' | 'masonry'
  columns: '2' | '3' | '4' | '6' | 2 | 3 | 4 | 6
}

export interface ImageGalleryBlockData {
  blockType: 'image-gallery'
  title?: string
  images: {
    image: PayloadMedia
    caption?: string
    link?: string
  }[]
  displayStyle: 'grid' | 'masonry' | 'carousel' | 'lightbox-grid'
  columns: '2' | '3' | '4' | '5' | 2 | 3 | 4 | 5
}

export interface TwoColumnContentBlockData {
  blockType: 'two-column-content'
  leftColumn: unknown // Lexical rich text
  rightColumn: unknown // Lexical rich text
  columnRatio: '50-50' | '60-40' | '40-60' | '70-30' | '30-70'
  reverseOnMobile: boolean
  verticalAlignment: 'top' | 'center' | 'bottom'
}

export interface SpacerBlockData {
  blockType: 'spacer'
  height: 'small' | 'medium' | 'large' | 'extra-large'
}

export interface SpotlightBlockData {
  blockType: 'project-spotlight'
  title?: string
  images: {
    image: PayloadMedia
    caption?: string
    link?: string
  }[]
  showArrows: boolean
  itemsPerView?: number
}

export type PageBlock =
  | HeroCarouselBlockData
  | StatsBarBlockData
  | ValuePropsBlockData
  | TestimonialsSectionBlockData
  | FAQSectionBlockData
  | RichTextContentBlockData
  | CallToActionBlockData
  | FeaturedVehiclesBlockData
  | ImageGalleryBlockData
  | TwoColumnContentBlockData
  | SpacerBlockData
  | SpotlightBlockData

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
 * Fetch wrapper with error handling
 */
async function payloadFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${PAYLOAD_API_BASE}${cleanEndpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

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
      `/static-pages?where[slug][equals]=${encodeURIComponent(slug)}&where[status][equals]=published&depth=2`
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
// CONTENT COLLECTIONS API (for block data)
// ============================================

/**
 * Get FAQs by category
 */
export async function getFAQsByCategory(category: string): Promise<FAQ[]> {
  try {
    const response = await payloadFetch<PayloadResponse<FAQ>>(
      `/faqs?where[category][equals]=${encodeURIComponent(category)}&where[status][equals]=published&sort=order&depth=1`
    )
    return response.docs
  } catch (error) {
    console.error(`[PayloadAPI] Error fetching FAQs for category "${category}":`, error)
    return []
  }
}

/**
 * Get featured FAQs
 */
export async function getFeaturedFAQs(limit: number = 10): Promise<FAQ[]> {
  try {
    const response = await payloadFetch<PayloadResponse<FAQ>>(
      `/faqs?where[featured][equals]=true&where[status][equals]=published&sort=order&limit=${limit}&depth=1`
    )
    return response.docs
  } catch (error) {
    console.error('[PayloadAPI] Error fetching featured FAQs:', error)
    return []
  }
}

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
      `/stats?${idsParam}&where[status][equals]=published&depth=0`
    )
    return response.docs
  } catch (error) {
    console.error('[PayloadAPI] Error fetching stats by IDs:', error)
    return []
  }
}

/**
 * Get hero slides by IDs
 */
export async function getHeroSlidesByIds(ids: string[]): Promise<HeroSlide[]> {
  try {
    const idsParam = ids.map((id) => `where[id][in]=${id}`).join('&')
    const response = await payloadFetch<PayloadResponse<HeroSlide>>(
      `/hero-slides?${idsParam}&where[status][equals]=published&depth=1`
    )
    return response.docs
  } catch (error) {
    console.error('[PayloadAPI] Error fetching hero slides by IDs:', error)
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
      `/value-props?${idsParam}&where[status][equals]=published&depth=0`
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

