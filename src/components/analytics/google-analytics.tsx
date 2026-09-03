"use client";

import Script from "next/script";
import { useConsent } from "@/components/consent/consent-context";

/**
 * Consent-gated Google Analytics, following the same stance as the Google Map
 * embed (design D8): no third-party script and no non-essential cookie before
 * the visitor has said yes.
 *
 * The `analytics` consent category already existed in the consent store and had
 * no reader — this is it. Until a visitor consents, nothing is injected at all:
 * gtag.js is never fetched, so no request reaches Google and no cookie is set.
 * That is stricter than loading gtag with consent-mode denied, and it is what
 * both the cookie banner and /cookies promise in so many words.
 *
 * The measurement ID comes from the environment rather than the source, matching
 * how the Maps key is handled. With no ID configured — local development, a
 * preview build — the component renders nothing, so analytics stay out of
 * environments that should not report.
 */

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function GoogleAnalytics() {
  const { analytics } = useConsent();

  if (!GA_MEASUREMENT_ID || !analytics) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      {/*
        `id` is required for an inline Script: it is how Next de-duplicates the
        tag across client-side navigations, which would otherwise re-run the
        bootstrap on every route change.
      */}
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
