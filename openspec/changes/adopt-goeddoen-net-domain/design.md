## Context

Production serves from `https://main.d229zu6l55642g.amplifyapp.com`. The code
believes otherwise: `src/lib/site.ts` defaults to `https://levendegemeenschap.nl`
and carries a comment recording it as a resolved decision. That domain was never
registered and returns NXDOMAIN. Only the Amplify environment variable
`NEXT_PUBLIC_SITE_URL` keeps the deployed site coherent, by overriding a default
that points nowhere.

`goeddoen.net` is registered in Route 53 with auto-renew enabled, in the same AWS
account as the Amplify app and the (currently empty) hosted zone
`Z08187161ZMTEDQOWZOSM`. Registrar, DNS and hosting sitting in one account is what
makes the certificate and DNS work straightforward: Amplify requests the ACM
certificate and writes its own validation and routing records.

Two properties of the existing code shape the work.

**Everything derives from one constant.** `site.url` feeds `metadataBase` in the
root layout, `robots.ts` (both the sitemap URL and the `host` line), `absolute()` in
`structured-data.ts` — and therefore every sitemap entry and JSON-LD URL — and
`og:url`. There are no scattered URL literals. The application change is one value.

**The domain also appears in three non-URL roles**, which a search for the canonical
constant does not reveal: six `mailto:` links across three public pages, the
`EMAIL_FROM` sending address, and the Nominatim `User-Agent` strings in
`geocode.ts` and the address-suggest route.

## Goals / Non-Goals

**Goals:**

- `https://goeddoen.net` is the site's canonical origin, served over TLS, with
  `www.goeddoen.net` redirecting to it.
- Every generated absolute URL — canonical tags, `og:url`, sitemap, `robots.txt`,
  JSON-LD — carries that origin.
- Administrator sign-in continues to work across the cutover.
- No string anywhere in the application names a domain or contact that does not
  exist.

**Non-Goals:**

- Renaming or rebranding. "Levende Gemeenschap" is unchanged; only the address moves.
- Provisioning a mailbox for `info@goeddoen.net`.
- Retiring the `.amplifyapp.com` hostname (see D5).
- Rewriting archived OpenSpec changes. They record decisions as they stood.

## Decisions

### D1: Apex canonical, `www` redirects

`goeddoen.net` is the canonical origin and `www.goeddoen.net` issues a redirect to
it. Amplify's domain management creates both, so this is a configuration choice
rather than code.

The direction matters more than which one wins: two hostnames both serving 200 for
the same content splits signals and makes it ambiguous which URL a person should
share. Picking the apex keeps spoken and printed addresses as short as possible,
which suits a neighbourhood audience.

### D2: `AUTH_URL` moves with the same deploy, not after it

`AUTH_URL` is the origin the admin session is issued against. `amplify.yml` writes a
fixed allowlist of variables — including `AUTH_URL` — into `.env.production` during
the build, because Amplify console variables are build-time only and do not
otherwise reach the SSR runtime. It therefore has to be correct *before* the build
that serves the new domain, not adjusted afterwards.

This is the one part of the change that breaks something if sequenced wrongly:
a stale `AUTH_URL` leaves an administrator unable to sign in on the new domain,
while the public site looks entirely healthy.

### D3: One contact address, stated honestly

The six `mailto:` links become `info@goeddoen.net`. Three role-specific addresses
imply three staffed inboxes; one address for a neighbourhood site is truthful about
how mail is actually handled, and is one thing to fix when a mailbox exists.

`EMAIL_FROM` becomes `no-reply@goeddoen.net` rather than `info@`. It is a sending
identity for future magic-link mail, not a contact — replies to it would go
unread, which is exactly what `no-reply` communicates.

Neither address receives mail on the day this ships. That is a knowing trade: three
addresses on a domain that cannot exist are replaced by one on a domain that does,
and can be made to work without touching the site again.

*Alternative considered:* leaving the contact pages until a mailbox exists.
Rejected — it would keep publishing addresses that are guaranteed to bounce.

### D4: The Nominatim `User-Agent` becomes truthful

Both geocoding paths identify themselves as
`levende-gemeenschap/1.0 (+https://levendegemeenschap.nl; admin@levendegemeenschap.nl)`.
Nominatim's usage policy requires a genuine contact so operators can reach whoever
is generating traffic; a fictional one is grounds for blocking. The strings take the
real domain and `info@goeddoen.net`.

This rides along because it is the same substitution, and because it is the only
place where a wrong domain has a consequence beyond presentation.

### D5: The Amplify hostname keeps serving, and canonical tags carry the load

Amplify does not retire its generated hostname when a custom domain is attached, so
after cutover the site answers on both. Rather than adding a host-matching redirect
rule, every page's canonical tag — absolute via `metadataBase` — will name
`goeddoen.net`, which is the conventional consolidation signal.

Recorded as a decision rather than left as an accident: the duplicate hostname is
known, tolerated, and mitigated. A redirect rule remains available later if the
Amplify URL ever attracts traffic worth reclaiming.

### D6: Do not touch archived changes

`openspec/changes/archive/2026-06-24-community-event-calendar/design.md` records
`levendegemeenschap.nl` as a resolved decision. It was one, then. Editing archives to
match present reality destroys their only value, which is showing what was believed
at the time. Only living surfaces are corrected: `src/lib/site.ts`, `.env.example`,
and the specs.

### D7: Content keeps its own addresses and identifiers

Eleven files under `content/` mention the old domain, in two roles that look alike
and are not.

The five event `uid:` values are iCal identifiers, where the `@domain` part is a
namespace rather than a mailbox. The calendar-import capability de-duplicates by
`uid` and uses it to hide entries a feed has dropped, so rewriting them would make
every event look new and break both behaviours. They stay.

The six venue and organiser `email:` values are contact details belonging to the
organisations the site publishes, not to the site. Repointing them at
`info@goeddoen.net` would tell a reader that an independent organisation is
reachable at the site's own address, which is no more true than the current value
and would have to be undone as real organisations replace this seed data. They stay
too, and will be corrected when the organisations they describe are real.

This is why the contact requirement in the spec delta is scoped to the site
speaking as itself: a genuine organiser's address will always be on a domain the
site does not control.

## Risks / Trade-offs

**A stale `AUTH_URL` locks the administrator out** → The public site would look
perfectly healthy while sign-in fails, so this will not surface on a casual check.
Set it in the same edit as `NEXT_PUBLIC_SITE_URL`, before the deploy, and verify
sign-in on the new domain explicitly rather than assuming.

**Certificate validation and DNS propagation are not instant** → An association can
sit pending for anywhere from minutes to hours, and it cannot be rushed. Treat a
pending state as expected rather than as a failure, and do not re-issue the
association while it is still validating.

**Both hostnames serve the same content** → Accepted under D5, mitigated by canonical
tags. Worth re-checking once indexed that search results settle on `goeddoen.net`.

**Share previews are cached per URL, permanently** → Cards already shared point at
the Amplify hostname and will keep doing so. Nothing can purge them. Verify the new
canonical by sharing a fresh `goeddoen.net` URL, not by re-checking an old card.

**`info@goeddoen.net` bounces on arrival** → Accepted under D3, and an improvement on
three fictional addresses. It does become a visible promise the site cannot yet keep,
so a mailbox or forwarder deserves its own change soon rather than eventually.

## Open Questions

- Should `AUTH_URL` remain reachable at the Amplify hostname for administrative
  access if DNS ever misbehaves? Tying it to `goeddoen.net` means a DNS failure takes
  the backend down with the front end. Acceptable for a site of this size, but worth a
  conscious answer rather than a default.
