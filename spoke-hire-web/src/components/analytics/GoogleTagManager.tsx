/**
 * Google Tag Manager Client Component
 *
 * Conditionally loads GTM based on the current route.
 * Excluded on admin routes to avoid tracking internal admin activity.
 */

"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { isAnalyticsExcludedRoute } from "~/lib/analytics/route-exclusions";

interface GoogleTagManagerProps {
  gtmId: string;
}

export function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const pathname = usePathname();
  const [isLoaded, setIsLoaded] = useState(false);

  const excluded = isAnalyticsExcludedRoute(pathname);

  useEffect(() => {
    if (excluded || isLoaded) return;

    // 1. Inject consent defaults script (must run BEFORE GTM loads)
    // Uses the standard Google gtag() pattern via an inline script
    const consentScript = document.createElement("script");
    consentScript.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied'
      });
    `;
    document.head.appendChild(consentScript);

    // 2. Push GTM start event and inject GTM script
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      "gtm.start": new Date().getTime(),
      event: "gtm.js",
    });

    const gtmScript = document.createElement("script");
    gtmScript.async = true;
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
    document.head.appendChild(gtmScript);

    setIsLoaded(true);
  }, [excluded, gtmId, isLoaded]);

  // Don't render noscript fallback on excluded routes
  if (excluded) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
