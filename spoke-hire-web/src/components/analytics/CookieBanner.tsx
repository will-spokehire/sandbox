/**
 * Cookie Consent Banner
 * 
 * GDPR-compliant cookie consent banner using react-cookie-consent.
 * Only shown in production environment.
 */

"use client";

import { useEffect, useState } from "react";
import CookieConsent from "react-cookie-consent";
import { setConsent, hasConsent, isProduction } from "~/lib/analytics";

export function CookieBanner() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Only show in production if consent hasn't been given yet
    if (isProduction && !hasConsent()) {
      setShouldShow(true);
    }
  }, []);

  if (!shouldShow) return null;

  return (
    <CookieConsent
      location="bottom"
      buttonText="Accept"
      declineButtonText="Decline"
      enableDeclineButton
      onAccept={() => {
        setConsent(true);
        setShouldShow(false);
      }}
      onDecline={() => {
        setConsent(false);
        setShouldShow(false);
      }}
      cookieName="spokehire_analytics_consent"
      style={{
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderTop: "1px solid var(--color-border)",
        boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
        padding: "1rem 1.5rem",
        alignItems: "center",
        gap: "1rem",
      }}
      contentStyle={{
        color: "var(--color-foreground)",
        fontSize: "0.875rem",
        margin: 0,
        flex: "1 1 auto",
      }}
      buttonStyle={{
        background: "var(--color-primary)",
        color: "var(--color-primary-foreground)",
        fontSize: "0.875rem",
        fontWeight: "500",
        padding: "0.5rem 1.5rem",
        borderRadius: "0.375rem",
        border: "none",
        cursor: "pointer",
        transition: "opacity 0.2s",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "var(--color-muted-foreground)",
        fontSize: "0.875rem",
        fontWeight: "500",
        padding: "0.5rem 1.5rem",
        borderRadius: "0.375rem",
        border: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      expires={365}
      overlay={false}
    >
      <span>
        We use cookies and similar technologies to analyze site traffic and
        improve your experience.{" "}
        <a
          href="/privacy-policy"
          className="underline hover:no-underline"
          style={{ color: "var(--color-primary)" }}
        >
          Privacy Policy
        </a>
      </span>
    </CookieConsent>
  );
}

