import "~/styles/globals.css";

import { type Metadata } from "next";
import { Suspense } from "react";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/providers/auth-provider";
import { Toaster } from "~/components/ui/sonner";
import { getAppUrl } from "~/lib/app-url";
import { AnalyticsProvider } from "~/components/analytics/AnalyticsProvider";
import { CookieBanner } from "~/components/analytics/CookieBanner";
import { env } from "~/env";
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

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appUrl = getAppUrl();
  const isProduction = env.NODE_ENV === "production";
  
  // Fetch site settings to get logo URL for organization schema
  const siteSettings = await getSiteSettings();
  const logoUrl = getLogoUrl(siteSettings);
  const gtmId = env.NEXT_PUBLIC_GTM_ID ?? null;

  // Organization structured data for the entire site
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SpokeHire",
    url: appUrl,
    logo: logoUrl.startsWith("http") ? logoUrl : `${appUrl}${logoUrl}`,
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
        
        {/* Google Tag Manager - loads in production when NEXT_PUBLIC_GTM_ID is set */}
        {isProduction && gtmId && (
          <>
            {/* Consent defaults must be set BEFORE GTM loads */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('consent', 'default', {
                    'analytics_storage': 'denied',
                    'ad_storage': 'denied'
                  });
                `,
              }}
            />
            {/* GTM container snippet */}
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                  })(window,document,'script','dataLayer','${gtmId}');`,
              }}
            />
          </>
        )}
      </head>
      <body>
        {/* GTM noscript fallback */}
        {isProduction && gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <TRPCReactProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <AnalyticsProvider>
                {children}
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
