"use client";

import { UserNavigation } from "~/app/user/_components/UserNavigation";

/**
 * Enquiry Layout
 * 
 * Shared layout for all /enquiry/* routes.
 * Provides consistent navigation using UserNavigation component.
 */
export default function EnquiryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <UserNavigation />
      {children}
    </>
  );
}


