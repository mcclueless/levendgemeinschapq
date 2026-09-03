## 1. Establish the cause

- [x] 1.1 Observe a statically generated event page across more than one
      revalidation window with no deploy in between: record `age`,
      `x-nextjs-cache` and the rendered date on first request, after eleven
      minutes, and after an hour.
- [x] 1.2 Compare the CDN response with the origin, to separate a CloudFront
      `stale-while-revalidate` hit from Next never regenerating.
- [x] 1.3 Conclude which of the three explanations in design D1 holds —
      revalidation not firing, an ISR cache not persisting across compute
      instances, or CDN over-serving — and record it in the design before choosing
      a remedy. Do not skip to a fix: two of the three make a `revalidate`
      adjustment useless.
- [x] 1.4 Determine whether `blog/[slug]`, `locaties/[slug]`,
      `organisatoren/[slug]` and `projecten/[slug]` share the behaviour, and record
      the answer even though this change does not act on them.
      They do: all four carry the same `generateStaticParams` + `revalidate = 600`
      shape, and the failure is in the platform's regeneration rather than in
      anything specific to the event route. None renders a today-relative value,
      so none shows a wrong date — but by the same mechanism an edit published
      through the backend will not appear on an existing detail page until the
      next deploy, while the `force-dynamic` listing that links to it updates
      immediately. That is inferred from the measured mechanism, not separately
      tested, and deserves its own change.

## 2. Apply the remedy

- [x] 2.1 Choose among design D3's candidates on the evidence from group 1.
- [x] 2.2 Implement it for `/agenda/[slug]`, keeping the occurrence in the
      server-rendered HTML so share cards stay correct (D2).
- [x] 2.3 Keep `generateMetadata` and the page body deriving the date from one
      expression, so the card and the page cannot drift apart.

## 2b. Phantom pages (scope extension, D5)

- [x] 2b.1 Render `sitemap.ts` per request, so it lists production content rather
      than the committed seed.
- [x] 2b.2 Render `blog/[slug]`, `locaties/[slug]`, `organisatoren/[slug]` and
      `projecten/[slug]` per request, and drop their `generateStaticParams`.
- [x] 2b.3 Remove the loaders those `generateStaticParams` were the only callers
      of, so no unused imports remain.
- [x] 2b.4 Confirm on the deployed site that the sitemap lists real content and
      that seed-only URLs no longer resolve.

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- [x] 3.2 Confirm a recurring event page and `/agenda` name the same occurrence.
- [x] 3.3 Confirm the occurrence appears in the raw HTML — fetch without executing
      scripts and read `og:description`.
- [x] 3.4 Run the Lighthouse assertions against an event page if the remedy renders
      per request, and confirm the budget in `lighthouserc.json` still passes.
      Note that `lighthouserc.json` collects only `http://localhost:3000/`, so the
      budget never asserted on an event page and still does not; the homepage was
      already `force-dynamic` and is unaffected. Measured instead against the
      deployed page: TTFB 0.33–0.56 s over five samples, comfortably inside the
      2500 ms LCP warning. Extending the Lighthouse URL list to cover a detail
      page would be worth its own change.
- [ ] 3.5 Confirm the page stays correct across a day boundary with no deploy in
      between. This is the only check that actually proves the fix; a verification
      that follows a build passes either way. It cannot be hurried.
