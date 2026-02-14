import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPageBySlug, getMediaUrl } from '~/lib/payload-api';
import { BlockRenderer } from '~/components/blocks/BlockRenderer';
import { HomepageLayout } from './layout-homepage';
import {
  getSiteSettings,
  getDefaultOgImage,
  getDefaultDescription,
  SEO_CONSTANTS,
} from '~/lib/seo';

/**
 * Enable Incremental Static Regeneration (ISR)
 * Revalidate every hour to keep featured vehicles fresh while benefiting from static generation
 */
export const revalidate = 3600; // 1 hour

/**
 * Generate metadata for the homepage
 */
export async function generateMetadata(): Promise<Metadata> {
  const [page, siteSettings] = await Promise.all([
    getPageBySlug('home'),
    getSiteSettings(),
  ]);

  const seo = page?.seo ?? {};
  const title =
    seo.metaTitle ??
    (siteSettings?.siteName
      ? `${siteSettings.siteName} - Classic & Vintage Vehicle Hire`
      : SEO_CONSTANTS.defaultTitle);
  const description =
    seo.metaDescription ??
    getDefaultDescription(siteSettings) ??
    SEO_CONSTANTS.defaultDescription;
  const ogImageUrl = seo.ogImage?.url
    ? getMediaUrl(seo.ogImage.url)
    : getDefaultOgImage(siteSettings);

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
  };
}

/**
 * Root Page
 *
 * Renders the homepage content from PayloadCMS using the "home" page.
 * Falls back to redirecting to /vehicles if no homepage exists in CMS.
 */
export default async function Home() {
  const page = await getPageBySlug('home');
  
  // Fallback: redirect to vehicles if no homepage in CMS
  if (!page) {
    redirect('/vehicles');
  }

  return (
    <HomepageLayout>
      <main>
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
    </HomepageLayout>
  );
}
