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

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`.
- [ ] 3.2 Confirm a recurring event page and `/agenda` name the same occurrence.
- [ ] 3.3 Confirm the occurrence appears in the raw HTML — fetch without executing
      scripts and read `og:description`.
- [ ] 3.4 Run the Lighthouse assertions against an event page if the remedy renders
      per request, and confirm the budget in `lighthouserc.json` still passes.
- [ ] 3.5 Confirm the page stays correct across a day boundary with no deploy in
      between. This is the only check that actually proves the fix; a verification
      that follows a build passes either way. It cannot be hurried.
