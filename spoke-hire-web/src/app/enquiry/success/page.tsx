"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { trackEvent } from "~/lib/analytics";

/**
 * Enquiry Success Page
 * Shown after successful enquiry submission
 */
export default function EnquirySuccessPage() {
  const router = useRouter();
  
  // Track if conversion event has been fired (prevent duplicates in Strict Mode)
  const hasTrackedConversionRef = useRef(false);
  
  // Track enquiry conversion on mount (only once to prevent duplicates in Strict Mode)
  useEffect(() => {
    if (!hasTrackedConversionRef.current) {
      hasTrackedConversionRef.current = true;
      trackEvent('enquiry_conversion');
    }
  }, []);

  return (
    <>
      {/* Header - Wizard Style */}
      <div className="bg-white">
        <div className="w-full flex flex-col items-center px-4 md:px-[30px] py-[41px]">
          <div className="w-full max-w-[808px] flex flex-col items-center gap-[11px]">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-500" />
              </div>
            </div>
            
            {/* Main Title */}
            <h1 className="text-[48px] md:text-[96px] font-normal leading-[0.95] uppercase text-black tracking-normal text-center">
              Thank you
            </h1>
            <p className="text-muted-foreground text-base md:text-lg text-center">
              We've received your enquiry and will get back to you as soon as possible
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-white">
        <div className="w-full flex flex-col items-center px-4 md:px-[30px] py-[41px]">
          <div className="w-full max-w-[808px] flex flex-col gap-10">
            {/* What happens next section */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-50">
                What happens next?
              </h3>
              <ul className="space-y-3 text-base text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-500 mt-0.5 text-xl">✓</span>
                  <span>Our team has been notified of your enquiry</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-500 mt-0.5 text-xl">✓</span>
                  <span>You'll receive a confirmation email shortly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 dark:text-green-500 mt-0.5 text-xl">✓</span>
                  <span>We'll review your requirements and contact you within 24-48 hours</span>
                </li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-center w-full">
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[480px]">
                <Button
                  onClick={() => router.push("/vehicles")}
                  variant="outline"
                  className="flex-1"
                >
                  browse vehicles
                </Button>
                <Button
                  onClick={() => router.push("/enquiry/new")}
                  className="flex-1"
                >
                  submit another enquiry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

