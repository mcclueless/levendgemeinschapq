## Context

`/agenda/[slug]` is the only route rendering a value derived from
`startOfToday()`. It does so twice — in `generateMetadata`, for `og:description`,
and in the page body — deliberately from the same expression so the card and the
page cannot disagree.

The route is statically generated (`generateStaticParams`) with
`revalidate = 600`. Responses carry `cache-control: s-maxage=600,
stale-while-revalidate=31535400` and `x-nextjs-cache: HIT`. Yet a page built on
31 August still served 31 August's answer on 3 September, and only a rebuild
corrected it. A cache-busting query string changed nothing, which is expected —
Next keys the ISR entry on the route, not the query — so it neither confirms nor
refutes CDN involvement.

`/agenda` and the other listing routes are `force-dynamic`, so they render per
request and were correct throughout. The site therefore already accepts
per-request rendering for its busiest pages.

## Goals / Non-Goals

**Goals:**

- An event page shows the correct next occurrence on the day it is read.
- The same date appears in the server-rendered HTML, so share cards are correct
  for crawlers that run no JavaScript.
- Understand whether ISR revalidation functions on this platform, since the answer
  governs every other cached route.

**Non-Goals:**

- Changing recurrence expansion or share-preview composition. Both are correct.
- Reworking the listing pages.
- Migrating off Amplify.

## Decisions

### D1: Establish the cause before choosing the remedy

Three explanations fit the evidence — revalidation never firing on Amplify
`WEB_COMPUTE`, an ISR cache that does not persist or is not consulted across
compute instances, or a CDN layer serving beyond `s-maxage` under
`stale-while-revalidate`. They are distinguishable with a short investigation:
watch `age` and `x-nextjs-cache` across repeated requests spanning more than ten
minutes, and compare the origin against the CDN.

They also imply different fixes, and two of the three would make a `revalidate`
adjustment useless. Guessing here risks a change that appears to work because a
deploy happened to intervene — which is exactly how this bug hid for three days.

### D2: The date must stay server-rendered

Computing the occurrence in the browser would fix what a person sees and leave
every share card wrong, because preview crawlers execute no JavaScript. Any
candidate fix must keep the value in the server-rendered HTML. This rules out the
otherwise-tempting client-side approach.

### D1a: What the investigation found

Measured against the deployed site on 2026-09-03, with no deploy during the window
(tasks 1.1–1.3):

```
t+0s   … t+480s    x-nextjs-cache: HIT      inside the 600s window
t+540s … t+960s    x-nextjs-cache: STALE    eight consecutive requests
```

Working ISR serves `STALE` once, regenerates in the background, and answers the
next request with a fresh `HIT`. Here the entry went stale and stayed stale for
seven further minutes across eight requests. It is marked stale, served, and the
regeneration never writes back.

A cache-busting request returned `x-cache: Miss from cloudfront` together with
`x-nextjs-cache: HIT`, so the response reached the origin and Next served it from
its own store. **CloudFront over-serving is eliminated.** What remains is that
background regeneration does not persist on this Amplify `WEB_COMPUTE`
deployment — consistent with the compute layer having no writable, shared
`.next/cache` across instances, so a regenerated page is discarded rather than
replacing the entry.

The practical consequence is stronger than the original symptom suggested: a
statically generated page here is frozen at build time permanently, and only a
deploy replaces it. Lowering `revalidate` cannot help, because the window is not
what fails.

### D3: Candidate remedies, to be chosen once D1 lands

**Render the route per request** (`dynamic = "force-dynamic"`). Correct by
construction, and consistent with the listing pages, which already do this. Costs
per-request rendering on event pages; the performance budget is the thing to watch.

**Scheduled rebuild.** A daily build refreshes every static page. Cheap to run, but
it fixes the symptom on a timer and leaves the underlying caching unexplained; a
page is still wrong for up to a day.

**Platform configuration.** If ISR is simply misconfigured, correcting it fixes
every cached route at once and preserves static delivery. Best outcome if the
investigation supports it.

The first is the safe fallback: it is small, reversible, and provably correct. The
third is preferable if D1 shows ISR can be made to work.

### D4: Treat the freshness guarantee as spec-level

The current specs say what an event page displays, not when that is determined.
Because the displayed value depends on the day of reading, "correct" is a property
of time as much as of content, and a spec that omits it cannot catch this class of
bug — as it did not. The requirement is written in terms of what a reader sees, so
it holds whichever remedy D3 selects.

### D5: The scope widened once the cause was known — phantom pages

Fixing the event route exposed something larger. `getStore()` reads the committed
`content/` seed during `next build` and S3 at runtime, justified in
`src/content/storage.ts` by the claim that "the seed equals the S3 state at deploy,
and time-based ISR reconciles any post-deploy edits, so this build/runtime split is
freshness-safe".

Both halves are false. The seed and S3 have diverged completely — the seed holds
`repair-cafe`, `t-anker`, `repair-noord`; production holds `burendag`, `annakerk`,
`thee-resia-samentuin-2` — and D1a establishes that nothing reconciles them,
because regeneration never persists.

So everything prerendered described seed data, permanently:

- The sitemap listed 25 URLs, of which every content URL was fictional. No real
  event, venue or organiser appeared in it at all. That directly violates the
  `seo-discoverability` requirement that a published item's canonical URL appears
  in the sitemap.
- Every `[slug]` route served a 200 for seed content that does not exist in
  production — `/locaties/t-anker`, `/organisatoren/repair-noord`,
  `/projecten/gemeenschapstuin-de-brink` — indefinitely, because revalidation never
  removed them.

This is the same defect as the stale date, in a more damaging form: not a page
showing an old value, but a page that should not exist at all. Since the remedy is
identical and the cause is one, the sitemap and the four remaining detail routes
are rendered per request here rather than deferred, and `generateStaticParams` is
removed with them — under `force-dynamic` it prerenders nothing and only preserved
the illusion that these routes had a build-time identity worth keeping.

This widens the change beyond its proposal, which scoped itself to
`/agenda/[slug]` and said the other routes "are not visibly wrong today". That was
wrong: they were visibly wrong, and I had not looked. Recorded here rather than
quietly folded in.

A consequence worth stating: the site no longer prerenders any content page. For a
neighbourhood calendar whose content lives in S3 and changes through a backend,
that is the honest arrangement — but it means every content page now costs a
render, and the build/runtime store split (`storage.ts:189`) remains as a latent
trap for anything that reintroduces prerendering.

## Risks / Trade-offs

**Per-request rendering could dent the performance budget** → `lighthouserc.json`
warns below 0.9 performance and 2500 ms LCP, and errors below 0.95 for
accessibility and SEO. The listings already render dynamically without apparent
trouble, but event pages should be measured rather than assumed.

**A deploy masks the bug** → Any verification that happens to follow a build will
pass regardless of whether the fix works. Confirming a fix means observing a page
stay correct across a day boundary with no deploy in between, which is slower than
it sounds and cannot be rushed.

**The blast radius may be wider than one route** → If revalidation is not firing,
four other content routes are serving deploy-time content while claiming a
ten-minute window. They are not visibly wrong today, so this change does not alter
them; it should say plainly whether they are affected so a later change can act.

**Timezone interacts with the day boundary** → `startOfToday()` uses server-local
midnight rather than Europe/Amsterdam midnight, already noted as a design risk in
`src/lib/date.ts`. Rendering per request makes the boundary matter more often, since
the value is recomputed continuously rather than at deploys. Out of scope here, but
adjacent enough to name.

## Open Questions

- Should the other four statically generated content routes change with this one,
  or wait until they demonstrate a visible problem? Fixing them together is
  coherent; fixing only the broken one keeps the change small and its verification
  honest.
