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

      Split into what could be settled early and what could not:

      - [x] The caching half. Three requests to a live event page return no
            `x-nextjs-cache` header at all, `cache-control: private, no-cache,
            no-store, max-age=0, must-revalidate`, and `Miss from cloudfront`
            every time. No cache layer remains that could serve tomorrow a render
            produced today — which was the entire failure mechanism.
      - [x] The rollover half, pinned rather than awaited. `startOfToday` takes an
            injectable clock, so `recurrence.test.ts` now crosses the boundary
            directly: the same expression the page uses yields 9 Sep at 23:59 on
            8 Sep, 16 Sep at 00:01 on 10 Sep, and still yields 9 Sep at midday on
            9 Sep so a same-day event is not skipped.
      - [x] Observing production across a day boundary. Checked on 2026-09-04,
            18 hours after the last deploy (2b17100, 2026-09-03T14:56) with none
            since, so the precondition finally held. All twelve event pages in
            the sitemap render a date correct for the day: nine today or later,
            and three in the past which are non-recurring events that have simply
            happened — `nextOccurrence` returns null for those and the page falls
            back to the event's own start, as intended. Cache headers unchanged
            after 18 hours: no `x-nextjs-cache`, `no-store`, CloudFront miss. With
            no cache entry to serve, the page necessarily re-executed
            `startOfToday()` on this request.
      - [ ] A discriminating rollover, still outstanding. None of the four
            recurring events would answer differently on the build day (3 Sep)
            than today: `high-mass` and `kerkdiensten-zuiderkruis` next fall on
            5 and 6 Sep, `de-buurttafel` on 9 Sep, `stilteviering` on 15 Sep — all
            unchanged by the boundary. So today's sweep is consistent with the fix
            without demonstrating it. The first date that separates the two is
            2026-09-06: `high-mass` recurs weekly on Saturday, so after its 5 Sep
            occurrence it must show 12 Sep, where a build-day answer would still
            say 5 Sep.
