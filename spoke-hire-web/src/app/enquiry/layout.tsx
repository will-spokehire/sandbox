import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { Footer } from "~/components/footer/Footer";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";
import { getNavigation } from "~/lib/payload-api";

/**
 * Enquiry Layout
 * 
 * Shared layout for all /enquiry/* routes.
 * Provides consistent navigation and footer using unified components.
 */
export default async function EnquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navigation = await getNavigation();

  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, LAYOUT_CONSTANTS.bgDefault)}>
      <PublicUserNavigation navigation={navigation} />
      <main className={LAYOUT_CONSTANTS.mainContent}>{children}</main>
      <Footer navigation={navigation} />
    </div>
  );
}


