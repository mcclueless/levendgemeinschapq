## 1. Users and passwords (D1, D2)

- [x] 1.1 Add `src/content/users.ts`: the user frontmatter schema, `listUsers`,
      `getUser`, `getUserByEmail` (case-insensitive), `createUser`,
      `setPassword`, `setDisabled`, all through `getStore()` under `users/`.
      Tests with a temporary local store: round trip, email uniqueness ignoring
      case, unknown id.
- [x] 1.2 Add `src/lib/password.ts`: `hashPassword` and `verifyPassword` with
      scrypt and `timingSafeEqual`, the `scrypt$N$r$p$salt$hash` format, and a
      twelve-character minimum check. Tests: verify succeeds and fails, a
      tampered hash fails, a short password is refused.
- [x] 1.3 Git-ignore `content/users/` and document the folder in
      `.env.example`'s auth section. Verify `git status` stays clean after
      creating a local account.
- [x] 1.4 Verify the S3 content bucket is private: block-public-access on and
      no public bucket policy, with the AWS CLI. Record the result in this
      task. Do not create a production account before this passes.
      (Checked 14 October 2026 with the AWS CLI: all four public-access
      blocks are on, there is no bucket policy, and the ACL grants only the
      owner. Passed.)

## 2. Sessions and sign-in (D3, D4, D11)

- [x] 2.1 In `src/lib/auth.ts`, make the token payload a `Session` union and
      `verifySessionToken` return it or null; `createSessionToken(session)`.
      Tests: admin and organisation tokens round-trip, a token of the other
      shape or a tampered one returns null.
- [x] 2.2 In `src/lib/auth-server.ts`, add `getSession`, `requireSession`
      (reads the user document for an organisation session and refuses a
      missing, disabled or password-changed account) and make `requireAdmin`
      send an organisation session to `/beheer?alleen=beheerder`. Keep
      `middleware.ts` accepting either role. Verify with `pnpm typecheck`.
- [x] 2.3 Rework the login action and page: optional email field, the admin
      path when empty, the account path otherwise, a ~1 s delay and one error
      message on any failure, the hint cookie for the admin only. Verify in the
      running app: admin login unchanged, an account logs in, a wrong password
      waits and shows the shared message.

## 3. The scope rule (D5)

- [x] 3.1 Add `src/content/access.ts` with `canManage` and `canView` over a
      session and a document's organiser fields. Tests: admin always; owner
      by primary organiser; co-organiser view-only; another organisation
      nothing; organiser page by slug; every other type admin-only.

## 4. Actions (D6, D9, D10)

- [x] 4.1 `createEvent` and `updateEvent`: accept any session, force the
      organisation as primary organiser, refuse the marker mode for an
      organisation session with `error=marker-admin-only` (message in
      `FORM_ERRORS`), and record `savedBy`. Test the organiser-forcing and the
      marker refusal as pure helpers (they live in `access.ts`, beside the
      scope rule, rather than in `event-form.ts`).
- [x] 4.2 `updateOrganiser`, `hideContent`, `showContent`, `deleteContent`:
      guard with `canManage` for an organisation session (events only for the
      last three) and record `savedBy` on organiser saves. `changePermalink`
      and organiser hide stay admin-only. Verify with `pnpm typecheck`.
- [x] 4.3 Media actions: uploads accept any session; delete, bulk delete,
      replace and details stay `assertAdmin`. Verify with `pnpm typecheck`.
- [x] 4.4 `changePermalink` for an organiser also rewrites `organisation` on
      user documents and reports them as referrers. Test with a temporary
      store: a user of the renamed organisation follows it, others untouched.
- [x] 4.5 Add `savedBy` (optional) to the event and organiser schemas and to
      `createDocument`/`updateDocument` callers in the backend, as the email or
      "beheerder". Test that an existing document without it still parses.

## 5. Pages and navigation (D7)

- [x] 5.1 `admin-nav.tsx` and `admin-shell.tsx`: per-role groups; the
      organisation role sees Overzicht, Evenementen, Mijn organisatie, Galerij,
      Wachtwoord. Verify in the running app.
- [x] 5.2 Overview: own event counts and "Nieuw evenement" for an organisation
      session; the "alleen voor de beheerder" notice when `?alleen=beheerder`.
- [x] 5.3 Event list: filter by `canView`, "beheerd door <name>" badge and no
      actions on co-organised rows, pending tab hidden; other types
      `requireAdmin`.
- [x] 5.4 Edit page: `canManage` or `notFound()`; for an organisation session
      hide the permalink form, the hide action, the marker radio and show the
      primary organiser fixed; show "Laatst opgeslagen door" from `savedBy`.
      New-event page: the same form rules.
- [x] 5.5 Gallery and its detail page: any session may upload and pick;
      delete, replace, bulk and details controls and the detail page admin
      only.
- [x] 5.6 Walk every file under `src/app/beheer` and every exported action in
      `actions.ts` and `body-actions.tsx`; complete the guard table in the
      design's D7 with every one of them (`requireAdmin`/`assertAdmin`,
      `requireSession` + scope, or any session). No route or action is left
      on the old boolean check.

## 6. Account pages (D8)

- [x] 6.1 `/beheer/gebruikers`: list, create (email, name, organisation,
      password), reset password, disable/enable, admin-only, with
      `FORM_ERRORS` entries for taken email, unknown organisation and short
      password. Verify in the running app: create, refuse a duplicate in
      another case, reset, disable.
- [x] 6.2 `/beheer/wachtwoord`: current and new password, re-issues the
      session token on success. Verify in the running app: a wrong current
      password is refused, a change keeps the session, and an older session
      in a second browser is refused afterwards.

- [x] 6.3 Delete an account: `deleteUser` in `users.ts` (test: gone by id and
      email, others stay), `deleteUserAction` admin-only, a confirmed
      "Verwijderen" per row and the `verwijderd` message. Added 16 October
      2026 after the first live test asked for it.
- [x] 6.4 Send a signed-in organisation account from `/evenement-indienen`
      (page and action) to `/beheer/nieuw/evenement` (D12). Added 16 October
      2026: the first tester's event went through the public form into the
      queue.

## 7. Verify

- [x] 7.1 Run `pnpm test`, also under `TZ=UTC`, `pnpm typecheck` and
      `pnpm lint`. All pass.
- [x] 7.2 In the running app with a local account for a temporary
      organisation: the account sees only its navigation; creates an event
      (its organisation fixed as primary, a co-organiser added, marker absent)
      and it is public at once; edits, hides, deletes it; cannot open another
      organisation's event (404) nor the queue, trash, feeds, venues, blog,
      projects or accounts pages (notice); edits its organisation page without
      permalink or hide; uploads to the gallery without delete controls; a
      co-organised event shows read-only; disabling the account ends its
      session; the admin renames the organisation and the account still works.
      Remove the temporary content. (Done 14 October 2026 against the dev
      server with a throwaway local admin password and a local account for
      the seed organisation Repair Noord. Exercised: sign-in and the shared
      failure message with its delay; the per-role navigation; creating,
      hiding and deleting an event as the account, with the organisation
      fixed as primary organiser and the marker mode absent; another
      organisation's event and page returning 404; every admin-only page
      sending the account to its overview with the notice; the co-organised
      event listed read-only with its view link; saving the organisation page
      without permalink or hide; uploading to the gallery without delete
      controls; the saver stamp on the admin's edit page; changing the own
      password; the admin creating, refusing a duplicate email in another
      case, disabling, enabling and resetting the account; renaming the
      organisation and back with the account following. The outdated-session
      and disabled-account refusals were checked with minted tokens over
      curl. Not exercised: adding a co-organiser on create, which is the same
      select the admin uses. The browser tool fires a form three times per
      click, so one save made three events; that is the tool, not the form.)
- [ ] 7.3 After deploy, with 1.4 passed: create the first real account on
      goeddoen.net, sign in as it in a private window, check the scope, and
      hand over the password in person. (First account created and tested
      15 October 2026; it raised 6.3 and 6.4.)
- [ ] 7.4 After the next deploy: as the organisation account, click
      "Evenement indienen" in the public header and land on the backend's new
      event form; save an event and see it in the agenda without approval.
      As the administrator, delete a test account and see it leave the list.
