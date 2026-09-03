## Context

`ConsentProvider` stores two categories, `embeds` and `analytics`, both defaulting
to false until the visitor decides. `MapEmbed` reads `embeds` and renders a
placeholder with an explicit opt-in rather than loading any Google resource.
`analytics` had no reader at all.

The banner and `/cookies` both promise that non-essential cookies follow consent,
and `/cookies` described only the map. Adding analytics without touching either
would have made the published policy incomplete about the site's own behaviour.

## Goals / Non-Goals

**Goals:**

- No request reaches Google Analytics, and no analytics cookie exists, until the
  visitor has consented.
- A visitor can allow the map without being measured, or the reverse.
- The cookie policy describes every category of non-essential cookie the site sets.
- The consent controls report the visitor's actual choice.

**Non-Goals:**

- Events or measurement beyond page views.
- Cookieless or server-side analytics.
- Google consent mode. It is unnecessary while the script is withheld outright,
  and would be the weaker guarantee (see D1).

## Decisions

### D1: Withhold the script entirely, rather than load it with consent denied

Google's documented alternative is to load `gtag.js` always and signal denial
through consent mode. That still fetches the script from Google and still puts the
visitor's IP in front of Google's servers on every page.

Not injecting anything is both simpler and stronger: with no tag, there is no
request, no cookie, and no third-party contact of any kind. It also matches
`MapEmbed`, so the site has one comprehensible stance rather than two — and it is
what the banner and cookie policy already told people.

### D2: Per-category consent, not one switch

`embeds` and `analytics` are granted and revoked independently. Wanting the map on
a venue page without being measured is a reasonable position, and so is the
reverse. The store already modelled the two separately; only the controls treated
them as one.

The preferences summary is derived from the categories actually allowed rather than
from `embeds` alone, which previously told a visitor who had enabled statistics
that they had chosen "alleen noodzakelijke cookies".

### D3: The measurement ID is configuration

`NEXT_PUBLIC_GA_MEASUREMENT_ID` rather than a literal, matching how the Maps key is
handled. With no ID the component renders nothing, so development and preview
builds do not pollute the property — a default that fails closed.

### D4: The inline bootstrap needs a stable `id`

Next's `Script` uses `id` to de-duplicate an inline script across client-side
navigations. Without it the gtag bootstrap re-runs on every route change in the App
Router, re-pushing `js` and `config` into `dataLayer`.

## Risks / Trade-offs

**Measurement undercounts, by design** → Visitors who decline are not recorded at
all, so totals describe consenting visitors rather than all traffic. That is the
intended trade and worth remembering before treating the numbers as absolute.

**The consented path renders only on the client** → The component reads consent
after hydration, so the tag never appears in server HTML. Verifying it fires
requires a real browser and GA Realtime; a curl of the page proves only the
withheld case.

**Policy text and behaviour can drift** → The cookie policy now names both
categories. Any future third party added to the site has to be described there too,
or the policy silently becomes wrong again — which is exactly the state this change
found.
