## Why

Every event on Goeddoen is entered or approved by the one administrator,
who signs in with a single shared password. Organisations that run events
every week cannot maintain their own entries, so the admin is the bottleneck.
The requester asked on 14 October 2026 for accounts the admin creates and
links to an organisation, so that organisations keep their own page and
events up to date themselves. The user-roles-approval spec has described a
"Limited User" since the project began, but nothing was ever built: the
backend knows one role and no user records.

## What Changes

- **Organisation accounts.** The admin creates an account with an email
  address, a name, one organisation and an initial password; can reset the
  password, disable the account, and see who has one. The person signs in
  with email and password on the existing login page and can change their own
  password. The administrator's password login is unchanged.
- **Scope: one organisation.** An organisation user sees and manages only
  what belongs to their organisation: its own page, and the events whose
  **primary organiser** it is. Events naming it as a co-organiser are shown
  read-only. Several users may share one organisation.
- **Events, directly published.** An organisation user creates, edits, hides,
  shows and deletes (to the trash) their organisation's events, with their
  organisation fixed as the primary organiser. Their changes publish at once;
  they do not enter the approval queue. Own-page and external-link events are
  available; the agenda-marker mode stays admin-only.
- **Organisation page.** The user edits its text, contact details, social
  links, images and logo. The permalink and hiding the page stay admin-only.
- **Gallery.** Organisation users upload and pick images; deleting and
  replacing stay admin-only.
- **Backend per role.** An organisation user's backend shows an overview of
  their own events, Evenementen, Mijn organisatie, Galerij and a password
  page. Locaties, Blogposts, Projecten, Wachtrij, Agenda-feeds, Import,
  Prullenbak and the new Gebruikers page are admin-only.
- **Traceability.** Every backend save records who made it, the account's
  email or the administrator, shown on the edit page.
- **Hardening.** A failed login waits about a second; a disabled account or a
  changed password cuts existing sessions off at the next request.
- **Permalink changes follow through.** Renaming an organisation also
  updates the organisation slug on its users' accounts.

Not in scope: projects and blog posts for organisation users; venue creation
by organisation users (the admin creates venues first); email sending of any
kind (passwords are handed over in person); organisation users approving
public submissions; the signed-in footer state and the contextual banner on
public pages for organisation users; admin accounts with their own email;
account lockout.

**BREAKING** for the spec, not for users: the user-roles-approval spec's
"Limited User" becomes the organisation account, owning exactly one
organisation, and its event submissions are no longer held for approval.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `user-roles-approval`: requirements **Roles and permissions** and
  **Organisation page ownership** reworded for the organisation account (one
  organisation, direct publishing); **Submission approval queue** narrowed to
  public submissions; new requirements **Event ownership by primary
  organiser**, **Account management by the administrator**, **Signing in with
  an account** and **Session validity**.
- `editorial-backend`: new requirements **Scoped backend for an organisation
  account**, **Event form for an organisation account**, **Gallery for an
  organisation account**, **Changing one's own password** and **Traceable
  backend writes**; requirement **Change the permalink of a Location,
  Organiser, or Project** gains the follow-through to accounts.

## Impact

- `src/lib/auth.ts`, `auth-server.ts`, `middleware.ts`: the session carries
  a role, user id and organisation; a session reader beside `isAdmin`; the
  login action and page take an email.
- New `src/content/users.ts` (+ schema): user documents under a `users/`
  prefix of the content store, scrypt password hashes, git-ignored locally.
  Must be verified: the S3 content bucket is private.
- One scope rule in `src/content/` used by every page and action under
  `/beheer`: admin, or the organisation user whose slug owns the item.
- `src/app/beheer/actions.ts` and the backend pages: role branches on the
  event and organiser forms, lists filtered by scope, admin-only pages kept
  admin-only; new Gebruikers and Wachtwoord pages; `changePermalink` rewrites
  user documents.
- `src/components/admin/admin-nav.tsx`: navigation per role.
- No migration of existing content: events already carry a primary
  organiser, and no user documents exist yet.
