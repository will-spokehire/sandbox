"use client";

import { PublicUserNavigation } from "~/components/navigation/PublicUserNavigation";

/**
 * Enquiry Layout
 * 
 * Shared layout for all /enquiry/* routes.
 * Provides consistent navigation using unified PublicUserNavigation component.
 */
export default function EnquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicUserNavigation />
      {children}
    </>
  );
}


