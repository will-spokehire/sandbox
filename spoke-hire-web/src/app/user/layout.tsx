import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { Footer } from "~/components/footer/Footer";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";
import { getNavigation } from "~/lib/payload-api";

/**
 * User Layout
 * 
 * Shared layout for all /user/* routes.
 * Provides consistent navigation across user pages with footer
 */
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getNavigation();

  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, LAYOUT_CONSTANTS.bgMuted)}>
      <PublicUserNavigation navigation={navigation} />
      <main className={LAYOUT_CONSTANTS.mainContent}>{children}</main>
      <Footer navigation={navigation} />
    </div>
  );
}

