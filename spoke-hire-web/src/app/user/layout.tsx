"use client";

import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { PublicFooter } from "~/app/vehicles/_components/PublicFooter";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

/**
 * User Layout
 * 
 * Shared layout for all /user/* routes.
 * Provides consistent navigation across user pages with footer
 */
export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, LAYOUT_CONSTANTS.bgMuted)}>
      <PublicUserNavigation />
      <main className={LAYOUT_CONSTANTS.mainContent}>{children}</main>
      <PublicFooter />
    </div>
  );
}

