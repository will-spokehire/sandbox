import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "~/trpc/react";
import { AuthProvider } from "~/providers/auth-provider";
import { Toaster } from "~/components/ui/sonner";

export const metadata: Metadata = {
  title: "SpokeHire - Admin Interface",
  description: "SpokeHire admin management system",
  icons: [{ rel: "icon", url: "/spoke-hire-logo-1.png" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
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
