## Why

The site needed visitor measurement, and the obvious way to add it — dropping
Google's `gtag.js` snippet into the root layout — would have loaded a third-party
script and set cookies for every visitor before any choice was offered. The site's
own cookie policy states the opposite in as many words: non-essential cookies are
placed only after the visitor agrees.

The consent store already carried an `analytics` category. It was persisted, set by
"Alles accepteren", described to visitors in the banner and the cookie policy — and
read by nothing. Analytics is what it was written for.

Two supporting gaps surfaced with it. The cookie policy described only the Google
Maps embed, so once analytics existed the policy would omit a cookie the site sets.
And the preferences panel could reach `analytics` only through "Alles accepteren",
while its summary line read `embeds` alone — a visitor who allowed statistics was
told they had allowed nothing.

## What Changes

- Load Google Analytics only after the visitor consents to the `analytics`
  category. Until then nothing is injected: `gtag.js` is never fetched, so no
  request reaches Google and no cookie is set.
- Take the measurement ID from `NEXT_PUBLIC_GA_MEASUREMENT_ID` rather than source.
  With no ID configured, nothing is rendered, so local and preview builds do not
  report.
- Describe the analytics cookies in the cookie policy alongside the map embed.
- Let a visitor allow embeds and analytics independently, and report each category
  accurately in the preferences panel.

Not in scope: any measurement beyond page views, server-side or cookieless
analytics, and consent-mode signalling to Google — none is needed while the script
is withheld entirely.

## Capabilities

### Modified Capabilities

- `accessibility-compliance`: the **EU cookie notification and consent** requirement
  states that non-essential cookies are withheld until consent. It gains the detail
  that consent is granted per category rather than as one switch, that withholding
  means not loading the third party at all, that the published policy must describe
  each category actually used, and that the consent controls must report the
  visitor's real choice.

## Impact

**Affected code**

- `src/components/analytics/google-analytics.tsx` — new, consent-gated.
- `src/app/layout.tsx` — mounts it inside the existing `ConsentProvider`.
- `src/components/consent/cookie-preferences.tsx` — per-category selection and an
  accurate summary.
- `src/components/consent/cookie-banner.tsx`, `src/app/cookies/page.tsx` — describe
  analytics as well as maps.
- `.env.example` — `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

**Deployment**

- `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set on the Amplify `main` branch.

**Already implemented**

This change was written after the work shipped, in commit `24f8321`. It records
decisions already made and live rather than proposing new ones; its tasks are
complete on arrival.

**No impact on**

- The consent store's shape or storage key — the `analytics` category already
  existed and is unchanged.
- Map embed behaviour.
