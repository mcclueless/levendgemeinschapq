# Runbook: closing task 3.5

Written for an unattended run on 2026-09-06. Follow it top to bottom.

You have **no AWS credentials**. Never call the AWS CLI.

## Why this exists

Event pages on <https://goeddoen.net> used to show a date computed at *build*
time rather than at read time. ISR regeneration never persists on this Amplify
deployment — the cache entry went `STALE` and stayed `STALE` indefinitely — so a
page built on 31 August still advertised 2 September on 3 September. Only a
redeploy corrected it.

The fix made the content routes `export const dynamic = "force-dynamic"`, so
every request re-executes `startOfToday()`. Task 3.5 asks for the single check
that actually proves this: a recurring event whose date **rolled forward across a
day boundary with no deploy in between**. Read `design.md` (D1a, D5) for the
full picture.

## The check

`https://goeddoen.net/agenda/high-mass` recurs **weekly on Saturdays**. Its last
occurrence was Saturday 5 September 2026.

```bash
curl -s https://goeddoen.net/agenda/high-mass | grep -o 'og:description[^>]*'
```

- **PASS** — the date reads **12 sep**, the next Saturday. The page recomputed
  today.
- **FAIL** — it still reads **5 sep**. That is the frozen build-time answer, and
  the fix did not work.

## The guard — check this before trusting a PASS

A deploy on 5 or 6 September would make the check meaningless, because a fresh
build would also compute 12 sep. Every commit to `main` triggers an Amplify
build, so:

```bash
git log --since=2026-09-05 --oneline
```

If anything landed on 5 or 6 September, the result is **INCONCLUSIVE**. Report
that, change nothing, and stop.

This guard matters more than it looks: this whole change exists because an
earlier check passed for the wrong reason.

## If PASS, and no deploy

1. In `tasks.md`, tick the remaining unchecked sub-item of 3.5 and record the
   observed date plus the UTC time you checked.
2. Sync the spec delta into the specs proper: take everything under
   `## MODIFIED Requirements` in `specs/events/spec.md` and use it to replace the
   `### Requirement: Single event view` block in
   `openspec/specs/events/spec.md`, stopping before
   `### Requirement: Event social media links`. Do not leave `## MODIFIED
   Requirements` headers in the main spec.
3. Verify with `openspec validate --specs` if the CLI is available; skip if not.
4. Move the change directory to
   `openspec/changes/archive/2026-09-06-fix-stale-recurring-event-dates`.
5. Delete this runbook as part of the same commit — it has served its purpose.
6. Commit and push to `main`. Say in the message what was observed, not just that
   it passed.

## If FAIL

Change nothing and archive nothing. Report loudly: `force-dynamic` did not
survive, or something re-introduced caching. Useful things to include — the
`cache-control` and any `x-nextjs-cache` header on the response, and whether
other event pages show the same problem.

## If you cannot push

The cloud runner may lack write access to this repo. If the push fails, still
report the observed result in full — the reading is the valuable part, and the
archiving can be done by hand afterwards.
