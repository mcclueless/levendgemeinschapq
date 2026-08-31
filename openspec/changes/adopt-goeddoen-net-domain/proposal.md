## Why

The site has never had a real address. `levendegemeenschap.nl` — recorded in
`src/lib/site.ts` as the canonical domain and used throughout the contact pages —
was never registered and does not resolve. Production currently serves from
`https://main.d229zu6l55642g.amplifyapp.com`, which is what every canonical tag,
sitemap entry and share card points at.

`goeddoen.net` is now registered in Route 53, in the same AWS account as the
Amplify app and its hosted zone. Adopting it gives the site an address a neighbour
can be told out loud, and closes the gap between what the code claims the domain is
and what it actually is.

This is not a domain migration. There is no old domain to move from, so there is no
SEO equity to transfer, no inbound links to preserve, and no redirects to write from
a previous host. It is the site's first real address, plus the correction of
everything that assumed one that never existed.

## What Changes

- Associate `goeddoen.net` with the Amplify app, with an ACM certificate validated
  through DNS. `goeddoen.net` becomes the canonical origin; `www.goeddoen.net`
  redirects to it.
- Point `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` at `https://goeddoen.net`. Every
  canonical URL, `og:url`, sitemap entry, `robots.txt` host line and JSON-LD URL
  derives from the single `site.url` constant, so these two values carry the whole
  application change.
- Correct `src/lib/site.ts` — its default and the comment naming the old domain as a
  resolved decision — and `.env.example`.
- Consolidate the six `mailto:` links on the contact, privacy and accessibility pages
  onto one address, `info@goeddoen.net`, replacing three separate addresses that have
  never worked. Set `EMAIL_FROM` to `no-reply@goeddoen.net`.
- Give the Nominatim `User-Agent` strings in `src/content/geocode.ts` and the
  address-suggest route a domain and contact that exist.

Not in scope: the site's name and branding, which stay "Levende Gemeenschap" — this
changes the address, not the identity. Mailbox provisioning for `info@goeddoen.net`
is also out of scope; see the Impact note below. Archived OpenSpec changes are left
as written, since they record what was decided at the time.

## Capabilities

### New Capabilities

None. The site's public addressing belongs to `seo-discoverability`, which already
owns canonical URLs, sitemap and crawler directives.

### Modified Capabilities

- `seo-discoverability`: gains a requirement that the site has one canonical origin
  which all generated absolute URLs use, and that alternative hostnames reach the
  same content without competing for it. Nothing in the specs currently states this —
  canonical URLs are required to exist, but the origin they should carry is
  undefined, which is precisely the gap that let a fictional domain sit in the code
  unchallenged.

## Impact

**AWS (no code)**

- Amplify app `d229zu6l55642g` (eu-central-1): domain association, ACM certificate,
  `www` → apex redirect.
- Route 53 hosted zone `Z08187161ZMTEDQOWZOSM`: currently NS and SOA only. Amplify
  writes the certificate-validation and routing records itself.
- Amplify environment variables `NEXT_PUBLIC_SITE_URL` and `AUTH_URL`.

**Affected code**

- `src/lib/site.ts` — the canonical default and its stale comment.
- `.env.example` — `NEXT_PUBLIC_SITE_URL`, `EMAIL_FROM`.
- `src/app/contact/page.tsx`, `src/app/privacy/page.tsx`,
  `src/app/toegankelijkheid/page.tsx` — six `mailto:` links.
- `src/content/geocode.ts`, `src/app/beheer/api/address-suggest/route.ts` — the
  Nominatim `User-Agent` strings.

**Existing defects this corrects**

- Three advertised contact addresses (`hallo@`, `privacy@`,
  `toegankelijkheid@levendegemeenschap.nl`) are on a domain that has never existed,
  so every message sent to them has bounced.
- Both Nominatim `User-Agent` strings identify the application with a fictional
  domain and contact. Nominatim's usage policy requires a genuine contact, so the
  application is currently block-eligible on both geocoding paths.

**Known and accepted**

- `info@goeddoen.net` will not receive mail when this ships. Registering the domain
  provides DNS, not mailboxes. This is a deliberate improvement on three fictional
  addresses rather than a solved problem, and provisioning a mailbox or forwarder is
  left for its own change.
- The `.amplifyapp.com` hostname keeps serving after cutover; Amplify does not retire
  it. Canonical tags will all name `goeddoen.net`, which is the standard consolidation
  signal.

**No impact on**

- Content, the content schema, or stored data.
- `NEXT_PUBLIC_MEDIA_BASE_URL` and the S3 buckets, which are addressed independently
  of the site domain.
- Site name, tagline, navigation, or any visual design.
