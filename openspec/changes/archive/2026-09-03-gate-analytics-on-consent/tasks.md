## 1. Consent-gated analytics

- [x] 1.1 Add `src/components/analytics/google-analytics.tsx`, reading the
      `analytics` consent category and rendering nothing until it is true.
- [x] 1.2 Take the measurement ID from `NEXT_PUBLIC_GA_MEASUREMENT_ID`, rendering
      nothing when it is unset (D3).
- [x] 1.3 Give the inline bootstrap a stable `id` so Next does not re-run it on
      every client-side navigation (D4).
- [x] 1.4 Mount the component inside the existing `ConsentProvider` in the root
      layout.

## 2. Make the consent controls honest

- [x] 2.1 Offer embeds and analytics independently in the preferences panel, and
      derive its summary from the categories actually allowed (D2).
- [x] 2.2 Describe the analytics cookies in `/cookies` alongside the map embed.
- [x] 2.3 Name analytics in the cookie banner text.

## 3. Configuration and verification

- [x] 3.1 Document `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.example`.
- [x] 3.2 Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` on the Amplify `main` branch.
- [x] 3.3 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- [x] 3.4 Confirm on the deployed site that no `googletagmanager` reference appears
      before consent, and that `/cookies` describes the analytics.
- [ ] 3.5 Confirm in a browser that the tag fires after consent and reaches GA
      Realtime. Needs a real browser; not verifiable from the shell (see the
      design's second risk).
