/**
 * Cookie Consent Banner
 * 
 * GDPR-compliant cookie consent banner using react-cookie-consent.
 * Only shown in production environment.
 * Styled to match SpokeHire design system.
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
      buttonText="ACCEPT"
      declineButtonText="DECLINE"
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
        background: "var(--spoke-white)",
        border: "1px solid var(--spoke-black)",
        borderTop: "1px solid var(--spoke-black)",
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.15)",
        padding: "1.5rem 2rem",
        alignItems: "center",
        gap: "1.5rem",
        maxWidth: "1512px",
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexWrap: "wrap",
      }}
      contentStyle={{
        color: "var(--spoke-black)",
        fontSize: "0.9375rem",
        lineHeight: "1.5",
        margin: 0,
        flex: "1 1 auto",
        minWidth: "280px",
        fontFamily: "var(--font-degular)",
      }}
      buttonStyle={{
        background: "var(--spoke-black)",
        color: "var(--spoke-white)",
        fontSize: "0.875rem",
        fontWeight: "500",
        padding: "11px 23px",
        borderRadius: "0",
        border: "1px solid var(--spoke-black)",
        cursor: "pointer",
        transition: "opacity 0.2s ease",
        textTransform: "uppercase",
        letterSpacing: "normal",
        fontFamily: "var(--font-helvetica)",
        whiteSpace: "nowrap",
      }}
      declineButtonStyle={{
        background: "transparent",
        color: "var(--spoke-black)",
        fontSize: "0.875rem",
        fontWeight: "500",
        padding: "11px 23px",
        borderRadius: "0",
        border: "1px solid var(--spoke-black)",
        cursor: "pointer",
        transition: "all 0.2s ease",
        textTransform: "uppercase",
        letterSpacing: "normal",
        fontFamily: "var(--font-helvetica)",
        whiteSpace: "nowrap",
      }}
      expires={365}
      overlay={false}
    >
      <span>
        We use cookies and similar technologies to analyse site traffic and
        improve your experience.{" "}
        <a
          href="/privacy-policy"
          className="underline hover:no-underline text-spoke-black font-medium transition-opacity hover:opacity-70"
          style={{ textDecorationColor: "var(--spoke-black)" }}
        >
          Privacy Policy
        </a>
      </span>
    </CookieConsent>
  );
}

