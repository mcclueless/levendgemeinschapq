## 1. Attach the domain in AWS

- [x] 1.1 Create the Amplify domain association for `goeddoen.net` on app
      `d229zu6l55642g` (eu-central-1), with the apex mapped to the `main` branch
      and `www` configured to redirect to the apex (design D1).
- [x] 1.2 Let Amplify request the ACM certificate and write its DNS validation
      records into hosted zone `Z08187161ZMTEDQOWZOSM`. Do not hand-write records,
      and do not re-issue the association while it is validating.
- [x] 1.3 Wait for the association to leave `PENDING_VERIFICATION` / `IN_PROGRESS`
      and reach `AVAILABLE`. This can take minutes or hours; a pending state is
      expected, not a failure.
- [x] 1.4 Confirm `https://goeddoen.net` serves the site over a valid certificate,
      and that `https://www.goeddoen.net` redirects to the apex.

## 2. Point the deployment at the new origin

- [x] 2.1 Set both `NEXT_PUBLIC_SITE_URL` and `AUTH_URL` to `https://goeddoen.net`
      in the Amplify **branch** environment variables for `main`, in one edit.
      (Set at branch rather than app level: app-level edits replace the whole
      variable set including the two secrets, which this session was not
      permitted to write. Branch values take precedence for `main`.) `AUTH_URL` must be
      correct *before* the build that serves the new domain — a stale value leaves
      the public site healthy while administrator sign-in fails (D2).
- [x] 2.2 Trigger a build so the new values take effect: `NEXT_PUBLIC_*` is inlined
      at build time, and `amplify.yml` writes `AUTH_URL` into `.env.production`
      during the build.
- [ ] 2.3 BLOCKED — needs the user. While in the Amplify console, rotate
      `ADMIN_PASSWORD` and `AUTH_SECRET`.
      Both were exposed in cleartext while investigating this change. Unrelated to
      the domain, but this is the one build where changing them costs nothing extra.

## 3. Correct the application's own idea of its address

- [x] 3.1 Update `src/lib/site.ts`: the `url` default becomes
      `https://goeddoen.net`, and the comment naming `levendegemeenschap.nl` as the
      resolved canonical domain is corrected. Leave `name` and `tagline` alone —
      the address changes, not the brand.
- [x] 3.2 Update `.env.example`: `NEXT_PUBLIC_SITE_URL=https://goeddoen.net` and
      `EMAIL_FROM=no-reply@goeddoen.net`.
- [x] 3.3 Replace the six `mailto:` links with `info@goeddoen.net` in
      `src/app/contact/page.tsx`, `src/app/privacy/page.tsx` and
      `src/app/toegankelijkheid/page.tsx`, including the visible link text, not
      only the `href` (D3).
- [x] 3.4 Update the Nominatim `User-Agent` strings in `src/content/geocode.ts` and
      `src/app/beheer/api/address-suggest/route.ts` to carry `https://goeddoen.net`
      and `info@goeddoen.net` (D4).
- [x] 3.5 Grep the tree for any remaining `levendegemeenschap` reference outside
      `openspec/changes/archive/`, which is deliberately left as written (D6).
      Two categories in `content/` are deliberately left alone (D7): the five
      event `uid:` values, which are iCal identifiers rather than addresses and
      whose change would break de-duplication, and the six venue/organiser
      `email:` values, which belong to third parties rather than to the site.

## 4. Verification

- [x] 4.1 Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm build`.
- [x] 4.2 Fetch `https://goeddoen.net/robots.txt` and confirm both the `Host` line
      and the sitemap URL name the new origin.
- [x] 4.3 Fetch `https://goeddoen.net/sitemap.xml` and confirm entries carry the new
      origin, not the Amplify hostname.
- [x] 4.4 Fetch an event page and confirm its canonical link tag and `og:url` name
      `goeddoen.net`. Check the same page via the `.amplifyapp.com` hostname: it
      SHALL still serve, and its canonical tag SHALL name `goeddoen.net` (D5).
- [x] 4.5 Sign in to `/beheer` on `https://goeddoen.net` and confirm the session
      holds across a page load. This is the check that catches a stale `AUTH_URL`,
      and nothing else will.
- [ ] 4.6 Share a `goeddoen.net` event URL into WhatsApp and confirm the card is
      correct. Use a URL not shared before — previews are cached per URL with no
      purge, so an old card proves nothing about the new origin.
- [x] 4.7 Confirm the site still reaches Nominatim: exercise the address-suggest
      path in the backend and check a suggestion returns.
