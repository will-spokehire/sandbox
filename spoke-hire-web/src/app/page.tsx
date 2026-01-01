import { redirect } from 'next/navigation';
import { getPageBySlug } from '~/lib/payload-api';
import { BlockRenderer } from '~/components/blocks/BlockRenderer';
import { HomepageLayout } from './layout-homepage';

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
            <BlockRenderer key={`${block.blockType}-${index}`} block={block} index={index} />
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
