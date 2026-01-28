import "~/styles/globals.css";

import { type Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/providers/auth-provider";
import { Toaster } from "~/components/ui/sonner";
import { getAppUrl } from "~/lib/app-url";
import { AnalyticsProvider } from "~/components/analytics/AnalyticsProvider";
import { CookieBanner } from "~/components/analytics/CookieBanner";
import { env } from "~/env";
import { MaxWidthWrapper } from "~/components/layout/MaxWidthWrapper";
import {
  getSiteSettings,
  getFaviconUrl,
  getLogoUrl,
  getDefaultDescription,
  SEO_CONSTANTS,
} from "~/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const siteSettings = await getSiteSettings();
  const appUrl = getAppUrl();

  return {
    title: siteSettings?.siteName
      ? `${siteSettings.siteName} - Classic & Vintage Vehicle Hire`
      : SEO_CONSTANTS.defaultTitle,
    description:
      getDefaultDescription(siteSettings) ?? SEO_CONSTANTS.defaultDescription,
    icons: {
      icon: getFaviconUrl(siteSettings),
      apple: getLogoUrl(siteSettings),
    },
    metadataBase: new URL(appUrl),
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appUrl = getAppUrl();
  const isProduction = env.NODE_ENV === "production";
  const gaId = env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  // Organization structured data for the entire site
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SpokeHire",
    url: appUrl,
    logo: `${appUrl}/spoke-hire-logo-1.png`,
    description: "Classic and vintage vehicle hire platform connecting vehicle owners with customers for special occasions",
    sameAs: [
      // Add social media profiles here when available
      // "https://www.facebook.com/spokehire",
      // "https://twitter.com/spokehire",
      // "https://www.instagram.com/spokehire",
    ],
  };
  
  return (
    <html lang="en">
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        
        {/* Google Analytics 4 - Only in production with valid ID */}
        {isProduction && gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                
                // Wait for consent before initializing
                gtag('consent', 'default', {
                  'analytics_storage': 'denied',
                  'ad_storage': 'denied'
                });
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        <TRPCReactProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <AnalyticsProvider>
                <MaxWidthWrapper>
                  {children}
                </MaxWidthWrapper>
                <Toaster />
                <CookieBanner />
              </AnalyticsProvider>
            </Suspense>
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
