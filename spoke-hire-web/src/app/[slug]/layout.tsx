import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { FooterWrapper } from "~/components/footer/FooterWrapper";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";
import { getNavigation } from "~/lib/payload-api";

/**
 * Layout for CMS Static Pages
 * 
 * Provides consistent navigation and footer for all pages
 * created via PayloadCMS static pages collection.
 */
export default async function StaticPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getNavigation();

  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, LAYOUT_CONSTANTS.bgDefault)}>
      <PublicUserNavigation navigation={navigation} />
      {children}
      <FooterWrapper />
    </div>
  );
}

