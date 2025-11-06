import type { ReactNode } from "react";
import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { PublicFooter } from "~/app/vehicles/_components/PublicFooter";
import { cn } from "~/lib/utils";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";

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
export function StandardPageLayout({
  children,
  maxWidth = "default",
  background = "default",
  includeNavigation = true,
  includeFooter = true,
}: StandardPageLayoutProps) {
  const bgClass = background === "muted" ? LAYOUT_CONSTANTS.bgMuted : LAYOUT_CONSTANTS.bgDefault;

  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, bgClass)}>
      {includeNavigation && <PublicUserNavigation />}
      <main className={LAYOUT_CONSTANTS.mainContent}>{children}</main>
      {includeFooter && <PublicFooter />}
    </div>
  );
}

