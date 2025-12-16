import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { FooterWrapper } from "~/components/footer/FooterWrapper";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

/**
 * Auth Layout
 * 
 * Shared layout for all /auth/* routes (login, signup, etc.)
 * Includes navigation header and footer for consistency
 */
export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, LAYOUT_CONSTANTS.bgDefault)}>
      <PublicUserNavigation />
      <main className={LAYOUT_CONSTANTS.mainContent}>{children}</main>
      <FooterWrapper />
    </div>
  );
}

