"use client";

import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";
import { PublicFooter } from "~/app/vehicles/_components/PublicFooter";
import { LAYOUT_CONSTANTS } from "~/lib/design-tokens";
import { cn } from "~/lib/utils";

/**
 * Enquiry Layout
 * 
 * Shared layout for all /enquiry/* routes.
 * Provides consistent navigation and footer using unified components.
 */
export default function EnquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={cn(LAYOUT_CONSTANTS.pageWrapper, LAYOUT_CONSTANTS.bgDefault)}>
      <PublicUserNavigation />
      <main className={LAYOUT_CONSTANTS.mainContent}>{children}</main>
      <PublicFooter />
    </div>
  );
}


