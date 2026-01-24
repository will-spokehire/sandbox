import type { Metadata } from "next";
import { EnquirySuccessContent } from "./EnquirySuccessContent";

/**
 * Metadata for the enquiry success page
 * Not indexed as it's a transactional page
 */
export const metadata: Metadata = {
  title: "Enquiry Sent | SpokeHire",
  description: "Your vehicle hire enquiry has been submitted successfully.",
  robots: { index: false, follow: false },
};

/**
 * Enquiry Success Page
 * Shown after successful enquiry submission
 */
export default function EnquirySuccessPage() {
  return <EnquirySuccessContent />;
}
