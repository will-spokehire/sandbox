import type { Metadata } from "next";
import { EnquiryFormPageContent } from "./EnquiryFormContent";

/**
 * Metadata for the new enquiry page
 * Not indexed as it's a transactional page
 */
export const metadata: Metadata = {
  title: "Vehicle Enquiry | SpokeHire",
  description: "Submit an enquiry for classic vehicle hire.",
  robots: { index: false, follow: false },
};

/**
 * Enquiry Form Page
 * Public-facing enquiry submission form
 */
export default function EnquiryFormPage() {
  return <EnquiryFormPageContent />;
}
