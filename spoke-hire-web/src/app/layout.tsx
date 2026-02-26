import "~/styles/globals.css";

import { type Metadata } from "next";
import { Suspense } from "react";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/providers/auth-provider";
import { Toaster } from "~/components/ui/sonner";
import { getAppUrl } from "~/lib/app-url";
import { AnalyticsProvider } from "~/components/analytics/AnalyticsProvider";
import { CookieBanner } from "~/components/analytics/CookieBanner";
import { GoogleTagManager } from "~/components/analytics/GoogleTagManager";
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
      </head>
      <body>
        {/* GTM - conditionally loaded based on route (excluded on admin pages) */}
        {isProduction && gtmId && <GoogleTagManager gtmId={gtmId} />}
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
