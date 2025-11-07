"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
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
    <div className="flex items-center justify-center py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-500" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl">
              Thank You for Your Enquiry!
            </CardTitle>
            <CardDescription className="text-base mt-3">
              We've received your enquiry and will get back to you as soon as possible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-500 mt-0.5">✓</span>
                  <span>Our team has been notified of your enquiry</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-500 mt-0.5">✓</span>
                  <span>You'll receive a confirmation email shortly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 dark:text-green-500 mt-0.5">✓</span>
                  <span>We'll review your requirements and contact you within 24-48 hours</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                onClick={() => router.push("/vehicles")}
                variant="outline"
              >
                Browse Vehicles
              </Button>
              <Button
                onClick={() => router.push("/enquiry/new")}
              >
                Submit Another Enquiry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

