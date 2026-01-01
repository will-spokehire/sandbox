import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { FooterWrapper } from "~/components/footer/FooterWrapper";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";
import { getNavigation } from "~/lib/payload-api";

/**
 * Layout for Homepage
 * 
 * Provides consistent navigation and footer for the CMS-driven homepage.
 * Same structure as other CMS static pages.
 */
export async function HomepageLayout({
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

