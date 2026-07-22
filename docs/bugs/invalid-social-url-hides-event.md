# Bug: an invalid social URL makes an event vanish from the site *and* the backend

- **Reported:** 2026-07-22
- **Severity:** Content loss — the item becomes invisible and un-editable, with no error anywhere in the UI
- **Status:** Open
- **Affects:** any content type with `socials` (event, organiser)

## Summary

`socialsFrom()` writes social URLs to frontmatter without validating them.
`SocialsSchema` validates them with `z.string().url()` on *read*. When the two
disagree, `parseAll` catches the validation error and **skips the document** — so
the event disappears from the public site, from `/agenda`, and from the backend
management list, which all read through the same parser. There is no way to reach
it in the UI to fix it.

The most likely trigger is the most natural thing a user can type: a social
handle URL without a scheme.

## Reproduction

1. Create or edit an event in `/beheer`. In the Instagram field, enter
   `instagram.com/buurttuin` (no `https://`).
2. Save. The save succeeds and reports success.
3. The event is now gone from `/agenda`, gone from its own detail page, and gone
   from `/beheer/evenementen`.

Verified against the real schema:

```
FAIL → instagram.com/buurt
FAIL → www.instagram.com/buurt
PASS → https://instagram.com/buurt
PASS → javascript:alert(1)          ← see "Second defect" below
```

## Cause

`src/app/beheer/actions.ts:140` — no validation on write:

```js
function socialsFrom(form: FormData) {
  const entries = SOCIAL_PLATFORMS.map((p) => [p, str(form, p)] as const)
    .filter((e) => Boolean(e[1]));
  return entries.length ? Object.fromEntries(entries) : undefined;
}
```

`src/content/schema.ts:48` — strict validation on read:

```js
export const SocialsSchema = z.object({
  instagram: z.string().url().optional(), ...
}).optional();
```

`src/content/parse.ts:46` — the amplifier:

```js
try { out.push(parseDoc(type, doc)); }
catch (err) { console.error(`[content] skipped invalid document: ...`); }
```

Skipping is the right behaviour for a genuinely corrupt file. It is the wrong
behaviour for a document the app itself just wrote, because the only signal is a
server-log line nobody is watching.

```
  admin types "instagram.com/x"
        │
        ▼
  socialsFrom → no validation → written to frontmatter ✔ "saved!"
        │
        ▼
  read: SocialsSchema.url() fails
        │
        ├──▶ repository.loadEvents  → parseAll skips → gone from /agenda
        ├──▶ admin.listContent      → parseAll skips → gone from /beheer
        └──▶ admin.getEditable      → parseDoc throws → returns null → 404
                                                        ↑
                                        no UI path back to the document
```

## Second defect, same code path

`z.string().url()` accepts **any** parseable URL, including `javascript:alert(1)`
(verified above). `src/components/content/social-links.tsx:46` renders it
directly:

```jsx
href={socials[p]}
```

with no scheme allowlist. Today this is admin-only and therefore self-inflicted.
It stops being self-inflicted the moment social fields are offered to public
submitters — see `openspec/changes/add-public-media-and-socials/`, which treats
a scheme allowlist as a blocking prerequisite rather than a nicety.

Not yet verified: whether React 19 refuses to render a `javascript:` href at the
DOM layer. Do not rely on it either way — `data:` and other schemes also pass
`.url()`, and the fix belongs at the validation layer regardless.

## Scope

| Path | Affected? |
|---|---|
| Admin event create / edit | **Yes** |
| Admin organiser create / edit | **Yes** — same `socialsFrom` |
| Public submission | Not yet — no social fields today |
| iCal import | No — never writes `socials` |

## Fix directions

1. **Validate on write.** Run `SocialsSchema` (or per-field `.url()`) inside the
   action and reject the save with a field-level message. Directly addresses the
   asymmetry.
2. **Normalise before validating.** Prepend `https://` when a value has no
   scheme, so `instagram.com/x` becomes valid rather than rejected. Friendlier;
   should be combined with (1), not instead of it.
3. **Allowlist schemes** to `http`/`https` at the schema, closing the
   `javascript:` hole for every consumer at once.
4. **Make skipped documents visible.** Separately from this bug: `parseAll`
   silently dropping content the app wrote is a systemic hazard — the same
   mechanism would fire if `RecurrenceSchema.until` were ever made required (see
   `openspec/changes/add-recurrence-end-date/` design D2). A backend surface
   listing unparseable documents would turn three silent-disappearance classes
   into one visible list.

(1) + (2) + (3) are small and belong together. (4) is a bigger idea worth its own
discussion.
