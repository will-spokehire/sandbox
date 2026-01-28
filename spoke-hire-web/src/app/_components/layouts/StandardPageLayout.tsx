import type { ReactNode } from "react";
import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { FooterWrapper } from "~/components/footer/FooterWrapper";
import { cn } from "~/lib/utils";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { getNavigation } from "~/lib/payload-api";

interface StandardPageLayoutProps {
  children: ReactNode;
  maxWidth?: "default" | "narrow" | "wide" | "full";
  background?: "default" | "muted";
  includeNavigation?: boolean;
  includeFooter?: boolean;
}

/**
 * Standard Page Layout
 * 
 * Provides consistent layout structure for all user-facing pages with:
 * - Optional navigation header
 * - Flexible background colors
 * - Flexible container widths
 * - Optional footer
 * - Consistent flex column layout with flex-1 main
 * 
 * Usage:
 * ```tsx
 * <StandardPageLayout maxWidth="narrow" background="muted">
 *   <YourContent />
 * </StandardPageLayout>
 * ```
 */
export async function StandardPageLayout({
  children,
  maxWidth = "default",
  background = "default",
  includeNavigation = true,
  includeFooter = true,
}: StandardPageLayoutProps) {
  const bgClass = background === "muted" ? LAYOUT_CONSTANTS.bgMuted : LAYOUT_CONSTANTS.bgDefault;
  const navigation = await getNavigation();

  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, bgClass)}>
      {includeNavigation && <PublicUserNavigation navigation={navigation} />}
      <main className={LAYOUT_CONSTANTS.mainContent}>{children}</main>
      {includeFooter && <FooterWrapper />}
    </div>
  );
}

