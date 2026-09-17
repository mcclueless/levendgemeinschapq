# Bug: event times are computed in the server's timezone, not Amsterdam's

- **Reported:** 2026-09-16 (Burendag shown at 02:00)
- **Severity:** Medium — wrong times shown publicly, and a DST shift was five
  weeks away from affecting every recurring event
- **Status:** **Fixed** 2026-09-17, corrected the same day (see "First fix got the
  stored data wrong"); some stored events need their time set once
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

## First fix got the stored data wrong

The first fix (`adb0b22`) read offset-less stored times as Amsterdam time,
assuming they had all been typed into a form. On production, every event moved
two hours earlier (High Mass 19:30 → 17:30, Kerkdiensten Zuiderkruis
12:00 → 10:00), including imported ones.

The reason was a second bug in the edit form. It prefilled a stored string by
cutting it to 16 characters, so an imported `'2026-08-22T17:30:00.000Z'` (19:30
in Amsterdam) showed as **17:30**. Saving the event for any reason, such as adding
a cover image, stored `'2026-08-22T17:30'` without the `Z`. Production, running in
UTC, read that back as UTC, which happened to be correct.

So an offset-less stored time is ambiguous. It is a UTC clock time for an import
saved through the form, and an Amsterdam clock time for an event typed into a form.
The value alone cannot say which. It was corrected forward to restore what
production had shown for months.

## Fix

`src/lib/date.ts` converts wall time and instants explicitly in the site timezone
(`siteWallTime`, `siteParts`):

- **Reading:** `parseStoredDateTime` reads an offset-less `start`/`end` as UTC,
  exactly as production always did, but now independent of the server's
  timezone. Values with an offset or `Z` are unchanged.
- **Writing:** all three event forms store the typed Amsterdam wall time as an ISO
  `Z` string (`siteInputToIso`), so no new ambiguous values are written.
- **Editing:** the edit form shows the stored instant as Amsterdam wall time
  (`toSiteInputValue`). What an editor sees is what the site shows, and saving
  unchanged keeps the same instant.
- **All-day imports:** the iCal import converts them to Amsterdam midnight. It
  fixes an entry's fallback UID before converting, so a re-sync does not duplicate
  it.
- **Recurrence:** `addDays` / `addMonths` do calendar arithmetic in site time, so
  occurrences keep their local time across DST.
- **Today:** `startOfToday` is Amsterdam midnight.

Tests in `src/lib/date.test.ts` pin each case, including the edit-form round trip.
The full suite passes with `TZ` set to `Europe/Amsterdam`, `UTC`, and
`America/New_York`.

## Existing data

Displayed times return to what production showed before 2026-09-17, except that
recurring events no longer shift an hour after 25 October.

- **Events typed into a form before this fix show two hours late** (one in winter),
  as before. Stilteviering (21:30, and 20:30 in winter) may be one. Open the event,
  set the real time, and save: it is then stored with `Z` and stays correct.
- **Burendag shows 02:00 again.** It is an all-day import that was saved through the
  old form. Set its time in the backend once.

Not changed: an all-day event still shows a time ("00:00") rather than none,
because there is no all-day flag on events.
