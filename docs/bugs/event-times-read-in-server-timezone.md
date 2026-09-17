# Bug: event times are computed in the server's timezone, not Amsterdam's

- **Reported:** 2026-09-16 (Burendag shown at 02:00)
- **Severity:** Medium — wrong times shown publicly, and a DST shift was five
  weeks away from affecting every recurring event
- **Status:** **Fixed** 2026-09-17 (code); one stored event needs a manual edit
- **Affects:** event forms, iCal all-day imports, recurring events, the "today"
  boundary

## Summary

Event times mean Amsterdam time, and formatting already used `Europe/Amsterdam`.
But four places turned wall-clock values into instants with the **server's**
timezone. Production runs in UTC, so in production:

| Path | Stored / computed | Shown |
|---|---|---|
| Event form, entered 19:30 (`'2026-09-25T19:30'`) | 19:30 UTC | **21:30** (20:30 in winter) |
| iCal all-day entry (`VALUE=DATE`) | 00:00 UTC | **02:00** |
| Weekly event at 19:30, after 25 Oct | `setDate` keeps 17:30 UTC | **18:30** |
| `startOfToday()` | 00:00 UTC | today starts at **02:00** |

Seen live on 2026-09-16:

```
burendag          startDate 2026-09-26T00:00:00.000Z   Za 26 sep · 02:00
stilteviering     startDate 2026-09-25T19:30:00.000Z   Vr 25 sep · 21:30
stilteviering-2   startDate 2026-10-30T19:30:00.000Z   Vr 30 okt · 20:30
```

The Stilteviering rows give it away. A real Amsterdam 19:30 is 17:30 UTC in summer
and 18:30 UTC in winter. The same UTC hour on both sides of the DST change means a
naive wall time was read as UTC.

It never showed locally, because development machines run in Amsterdam time.

## Fix

`src/lib/date.ts` now converts wall time ↔ instant explicitly in the site timezone
(`siteWallTime`, `siteParts`), and every affected path uses it:

- `parseSiteDateTime` reads an offset-less event `start`/`end` as Amsterdam time
  (`EventFrontmatter`). Values with an offset or `Z` are unchanged.
- The iCal import converts all-day entries to Amsterdam midnight. It fixes an
  entry's fallback UID before converting, so a re-sync does not duplicate it.
- `addDays` / `addMonths` do calendar arithmetic in site time, and the recurrence
  expansion uses them, so occurrences keep their local time across DST.
- `startOfToday` is Amsterdam midnight.

Tests in `src/lib/date.test.ts` pin each case. The full suite passes with `TZ` set
to `Europe/Amsterdam`, `UTC`, and `America/New_York`.

## Existing data

- **Form-entered events correct themselves.** They are stored as offset-less wall
  time, so after deploy they show the time that was typed (Stilteviering: 19:30).
  If an editor ever *compensated* by typing an earlier time, that event now shows
  the compensated time and needs the real time entered.
- **Imported all-day events stay wrong** until edited: they are stored with `Z`
  (e.g. Burendag, `2026-09-26T00:00:00.000Z`). Open the event in the backend, set
  the real start time, and save. A re-sync will not correct it, because imports
  never overwrite an existing event.

Not changed: an all-day event still shows a time ("00:00") rather than none,
because there is no all-day flag on events.
