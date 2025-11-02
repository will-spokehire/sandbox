import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/providers/auth-provider";
import { Toaster } from "~/components/ui/sonner";
import { getAppUrl } from "~/lib/app-url";

export const metadata: Metadata = {
  title: "SpokeHire - Classic & Vintage Vehicle Hire",
  description: "SpokeHire connects you with meticulously maintained classic and vintage vehicles for your special occasions.",
  icons: [{ rel: "icon", url: "/spoke-hire-logo-1.png" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const appUrl = getAppUrl();
  
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
    <html lang="en" className={`${geist.variable}`}>
      <head>
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body>
        <TRPCReactProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}
