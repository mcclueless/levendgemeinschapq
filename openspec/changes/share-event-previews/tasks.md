## 1. Groundwork

- [x] 1.1 Bring the working branch up to `origin/main`. The local checkout sits
      three commits behind, and design decision D3 relies on the next-occurrence
      behaviour merged in `5e474c0`; implementing against the older tree would
      reproduce bugs already fixed.
- [x] 1.2 Confirm the two open questions in `design.md` before writing user-visible
      strings: whether `twitter:card` is in scope, and whether the `nl-NL`
      lowercase weekday ("za 5 sep") is capitalised at the head of a card.

## 2. Shared recurrence label

- [x] 2.1 Add `src/lib/recurrence-label.ts` exporting `recurrenceLabel(r)` — the
      short interval phrase (`Elke week`, `Elke 2 weken`, `Elke maand`,
      `Elke 2 maanden`), returning `undefined` when the event does not repeat.
- [x] 2.2 Add `recurrenceDetail(r)` to the same module for the fuller admin
      phrasing: `Eenmalig` when absent, otherwise the short phrase followed by
      `, t/m <date>` or `— zonder einddatum`.
- [x] 2.3 Write unit tests covering interval 1 and interval > 1 for both weekly and
      monthly, the no-recurrence case, and the with-/without-end-date branches of
      `recurrenceDetail`. The interval > 1 cases are the regression guard for the
      defect this change corrects.
- [x] 2.4 Make the new test actually run: `pnpm test` globs
      `src/content/*.test.ts`, which will not reach a test under `src/lib/`.
      Widen the glob rather than misplacing the test to suit it.

## 3. Share metadata composition

- [x] 3.1 Add a helper that composes an event's social description as
      `date · time · recurrence — excerpt`, joining only the segments that have
      values so no stray separator or dangling dash survives an absent field.
- [x] 3.2 Add a helper that composes the social title as
      `<event title> · <venue name>`, falling back to the title alone when the
      event has no venue.
- [x] 3.3 Source the date from
      `nextOccurrence(event.start, event.recurrence, startOfToday())` with a
      fallback to `event.start` — the same expression the page body uses — so the
      card and the page cannot disagree (D3).
- [x] 3.4 Format date and time through the existing `formatDate` / `formatTime`
      helpers in `src/lib/date.ts` rather than introducing new formatting.
- [x] 3.5 Unit-test the composition: recurring versus non-recurring, missing
      excerpt, missing venue, and a recurring event whose stored start has already
      passed.

## 4. Wire into the page and the shared helper

- [x] 4.1 Use the new composition helpers in `generateMetadata` in
      `src/app/agenda/[slug]/page.tsx`, replacing the bare title and raw `excerpt`.
- [x] 4.2 Extend `pageMetadata` in `src/lib/metadata.ts` to emit `og:image:width`
      and `og:image:height` alongside the image URL, so every content type gains
      the large-card hint (D5).
- [x] 4.3 Verify the page's own `<title>` and meta description still read well.
      `pageMetadata` currently feeds one title into both the document title and
      `og:title`; if the venue-bearing title is unwanted in the browser tab, pass
      the two separately rather than letting the share title leak into page
      chrome.

## 5. Converge the existing call sites

- [x] 5.1 Replace the inline badge expression at
      `src/app/agenda/[slug]/page.tsx:81` with `recurrenceLabel`, so the public
      page starts reflecting the interval.
- [x] 5.2 Replace the local `recurrenceLabel` at
      `src/app/beheer/queue/page.tsx:52` with `recurrenceDetail`, and delete the
      local copy.
- [x] 5.3 Grep for any remaining hand-written "Elke"/"Wekelijks"/"Maandelijks"
      strings and fold them in, so no fourth variant is left behind.

## 6. Verification

- [x] 6.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build`. These
      four are what CI runs, except that CI does not run `pnpm test` at all —
      a pre-existing gap, out of scope here, worth raising separately.
- [x] 6.2 Inspect the rendered tags directly — `curl` an event page and read the
      `og:` tags — rather than relying on a preview client, whose cache makes it a
      poor feedback loop.
- [x] 6.3 Check the composed description against a recurring event, a
      non-recurring event, an event with no excerpt, and an event with no venue.
- [ ] 6.4 Validate with an external preview debugger against a URL no client has
      cached. Expect previously shared links to keep their old card; that is the
      documented cache behaviour, not a defect.
- [x] 6.5 Confirm the review queue and the public event page now describe the same
      recurring event identically, including one with an interval greater than one.
