## Context

Auth is one env password and a jose-signed cookie carrying `{role: "admin"}`
(`src/lib/auth.ts`); `verifySessionToken` returns a boolean, `middleware.ts`
checks it for `/beheer/*`, and every page and action calls `requireAdmin` or
`assertAdmin` — 49 sites. There are no user records. The original plan
(Auth.js magic link over SES) was never built.

Content is MD/MDX documents in a `ContentStore` (local `content/` folder,
S3 in production) under per-type prefixes; the listing filters on the
`.md|.mdx` extension. Feeds already live under their own prefix invisible to
the content readers, which all enumerate their prefixes explicitly. The
`content/` folder is committed to git, bar `.index.json` and `trash/`.

An event stores one primary `organiser` and `moreOrganisers`
(`eventOrganiserSlugs`, `organiserFields` in `event-organisers.ts`); the
organiser document's slug is the organisation's identity everywhere.
`changePermalink` rewrites every referrer of a renamed organiser by raw
frontmatter and patches only the changed fields.

Tests are `node:test` over `src/**/*.test.ts`: pure functions and
form-parsing helpers, not components or actions.

## Goals / Non-Goals

**Goals:** accounts with no new infrastructure; one scope rule the whole
backend shares; nothing changes for the administrator's login or for public
pages.

**Non-Goals:** email of any kind; admin accounts with email; projects, blog
posts, venues for organisation users; public-page presence; lockout.

## Decisions

### D1. Users are frontmatter documents under `users/`, outside `ContentType`

`users/<id>.mdx` with frontmatter `{ email, name, organisation, passwordHash,
passwordChangedAt, disabled, createdAt }` and an empty body; `id` is a
random 16-byte hex string, never derived from the email: two distinct
addresses can slugify to one value, so creation checks the email itself,
lower-cased, against every user document. A separate `src/content/users.ts` with its own zod schema
reads and writes them through `getStore()`. `users` is **not** added to
`ContentType`, so lists, counts, the index, the trash, the reference guards
and the sitemap never see them, exactly as feeds are kept apart.

`content/users/` is git-ignored: a local account's hash must not be committed.
`next build` reads the committed seed, so the build has no users, which is
fine: sign-in is a runtime path reading S3.

*Why not JSON:* the store's listing only returns `.md|.mdx` keys.
*Why the content store at all:* it is the one persistence the app has; a
database for a handful of accounts would be new infrastructure.

**Must verify before the first account exists:** the S3 content bucket is
private (block public access on, no public bucket policy, served only through
the app). Task 1.4.

### D2. Passwords: `node:crypto` scrypt, no dependency

`scrypt(password, salt16, 64, {N: 2**15, r: 8, p: 1})`, stored as
`scrypt$N$r$p$<salt b64>$<hash b64>` so parameters can change later; compared
with `timingSafeEqual`. Minimum twelve characters, no other rules. A failed
sign-in sleeps ~1 s before answering, and unknown email, wrong password and
disabled account produce the same redirect, so the form cannot be used to
enumerate accounts. scrypt at these parameters costs ~50 ms, which is the
rest of the brute-force budget for v1.

### D3. One session shape, two roles

The JWT payload becomes `{ role: "admin" } | { role: "organisation", sub: id,
org: slug, pv: passwordChangedAt epoch }`. `verifySessionToken` returns the
parsed `Session | null`; `isAdmin()` keeps its meaning. New in
`auth-server.ts`:

- `getSession()` — the verified payload, or null.
- `requireSession()` — redirects to login when absent. For an organisation
  session it also reads the user document and refuses when the document is
  missing, `disabled`, or `passwordChangedAt > pv` (D4). One store read per
  backend request; the login page and public pages never do it.
- `requireAdmin()` — unchanged for the admin; an organisation session is sent
  to `/beheer?alleen=beheerder`, where the overview shows the notice. The
  overview itself calls `requireSession`, never `requireAdmin`, or that
  redirect would loop. `assertAdmin()` in the actions does the same, so a
  signed-in organisation user who triggers an admin-only action lands on
  their overview, not on a login form.

The middleware stays edge-only and accepts either role: it keeps strangers
out, the pages decide the rest. The `lg_admin` hint cookie is set for the
admin only, so the public footer and banner stay admin-only.

### D4. Invalidation by comparison, not by a session list

Disabling or changing a password must end existing sessions. Rather than a
server-side session store, the user document is the source of truth: each
backend request compares it with the token (D3). Changing one's own password
issues a fresh token so the current session continues.

### D5. The scope rule lives in one module

`src/content/access.ts`:

```ts
canManage(session, "organiser", slug)  -> admin || session.org === slug
canManage(session, "event", doc)       -> admin || primaryOrganiser(doc) === session.org
canView(session, "event", doc)         -> canManage || eventOrganiserSlugs(doc).includes(session.org)
canManage(session, anything else)      -> admin
```

Pure and tested. Every shared page and action calls it; admin-only ones keep
`assertAdmin`. An organisation session that fails `canManage` on an edit
address gets `notFound()`; on an action, the action returns without writing.

### D6. Actions branch on role in four places only

- `createEvent` / `updateEvent`: with an organisation session, the posted
  organisers are replaced by `[session.org, ...others without it]` so the
  organisation is always primary; the marker mode is refused with
  `error=marker-admin-only`; everything else (venue, recurrence, dates, mode
  page/external, publish box) is as for the admin.
- `updateOrganiser`: `canManage("organiser", slug)`; `changePermalink`,
  `hideContent` on an organiser stay `assertAdmin`.
- `hideContent` / `showContent` / `deleteContent`: events only for an
  organisation session, via `canManage`.
- Media: `uploadMedia`, `uploadInlineImage`, cover and list uploads accept any
  session; delete, bulk delete, replace and details stay `assertAdmin`.

### D7. Pages: filter, hide, redirect

- Overview: for an organisation session, its own event counts, "Nieuw
  evenement", and the "alleen beheerder" notice when redirected there.
- `[type]/page`: `event` list filtered by `canView`, with a "beheerd door X"
  badge and no actions on co-organised rows; the pending tab hidden. Any
  other type: `requireAdmin`.
- "Mijn organisatie" links straight to `organisatoren/<org>/bewerken`; the
  edit page checks `canManage`, hides the permalink form, hide action and
  the admin-only event fields (marker radio, primary organiser select shown
  fixed), and shows the "laatst opgeslagen door" line (D9).
- Gallery: accepts any session; delete, replace, bulk and details controls
  render for the admin only; `[name]` detail page is admin-only.
- `admin-nav.tsx` takes the role and renders the per-role groups.

Guard per route and action, filled in by task 5.6:

| Route or action | Guard |
|---|---|
| `/beheer` (overview) | `requireSession` |
| `/beheer/evenementen`, new and edit event | `requireSession` + `canView`/`canManage` |
| `organisatoren/<slug>/bewerken` | `requireSession` + `canManage` |
| `/beheer/galerij` | `requireSession`; admin-only controls hidden |
| `/beheer/wachtwoord` | `requireSession`, organisation role |
| everything else under `/beheer` | `requireAdmin` |
| `createEvent`, `updateEvent`, `updateOrganiser`, hide/show/delete | session + `canManage` |
| uploads | any session |
| all other actions | `assertAdmin` |

### D8. Account pages

`/beheer/gebruikers` (admin): table of accounts with organisation, state and
created date; a create form (email, name, organisation select from
`getOrganisers()`, password); per-row reset-password and disable/enable
forms. `/beheer/wachtwoord` (organisation session): current password, new
password twice. Both are ordinary server-action forms in the house style.

### D9. Every backend write records its saver

`updateDocument`/`createDocument` callers pass `savedBy`: the account's email
or `"beheerder"`, stored as frontmatter `savedBy` on event and organiser
documents (optional in the schema, so existing files are untouched). The
proposal said organisation writes only; recording the admin too is one more
string and keeps the field truthful after the admin edits. The edit page
shows it under the form.

### D10. Permalink follow-through

`changePermalink` for an organiser also rewrites `organisation` on every
user document whose value is `from`, reported as a referrer kind `user` so
the result names it. Users are **not** counted by the hide/delete reference
guards: an organisation with accounts can still be hidden (its users keep
editing it) and cannot be deleted anyway while events reference it.

### D11. Login form

One form: email (optional, "alleen voor organisatie-accounts") and password.
Email empty → the admin password path, unchanged. Email given → D2. Both
paths set the same session cookie.

## Risks / Trade-offs

- [Password hashes in the content bucket] → bucket privacy verified in 1.4
  before any account is created; hashes are scrypt with per-user salt.
- [A leaked `AUTH_SECRET` forges any session] → already true today; unchanged.
- [One extra store read per backend request] → the backend is
  `force-dynamic` and small; S3 `GetObject` is milliseconds.
- [Two users of one organisation overwrite each other's edit] → the same
  last-write-wins the admin has today; accepted for v1.
- [The 49 call sites: a page left on `requireAdmin` by mistake locks
  organisation users out, one left on `requireSession` without a scope check
  lets them in] → task 5.6 lists every `/beheer` route and action with its
  guard; the in-app check walks the organisation role through each.
- [Local dev has no users folder] → the Gebruikers page creates one; the
  folder is ignored, so a developer's test account stays local.

## Migration Plan

No data migration. Deploy, verify the bucket, create the first account from
`/beheer/gebruikers`, hand over the password in person. Rollback is a
revert: user documents under `users/` are invisible to the previous code.
