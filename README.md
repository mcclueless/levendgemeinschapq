# Levende Gemeenschap — Community Event Calendar

A fast, accessible neighborhood event calendar: **events**, **venues**, and
**organisers**, plus a blog. Built per the OpenSpec change
[`community-event-calendar`](./openspec/changes/community-event-calendar/).

## Stack

- **Next.js (App Router) + TypeScript**, statically generated for SEO/GEO and speed
- **Tailwind CSS v4** with a warm, AA-accessible design system
- **Content as MD/MDX in S3** (single source of truth) with a derived query index
- **AWS Amplify Hosting** (Next.js SSR) with **time-based ISR** (600s) as the freshness mechanism; on-demand revalidation is a best-effort speed-up. (See D4.)
- **Interim single-admin auth** (password + signed-JWT session) with an admin approval queue. Multi-user magic-link email (Auth.js + Amazon SES) is a planned follow-up.

See `openspec/changes/community-event-calendar/design.md` for the full rationale
and resolved decisions.

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in values as features come online
pnpm dev                     # http://localhost:3000
```

## Scripts

| Script           | Purpose                              |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Start the dev server                 |
| `pnpm build`     | Production build                     |
| `pnpm start`     | Serve the production build           |
| `pnpm lint`      | ESLint (next/core-web-vitals)        |
| `pnpm typecheck` | TypeScript, no emit                  |

## Quality gates

CI (`.github/workflows/ci.yml`) runs typecheck, lint, build, and **Lighthouse CI**
(`lighthouserc.json`) enforcing accessibility ≥ 0.95, SEO ≥ 0.95, and a CLS budget.

## Project status

Implementation tracks `openspec/changes/community-event-calendar/tasks.md`.
Feature work is complete: content pipeline, domains (events/venues/organisers),
blog, auth/approval, editorial backend, calendar import, and SEO/accessibility
are all in place. Remaining tasks are deploy-time only — production deployment to
AWS Amplify, a live Lighthouse audit, and (deferred) multi-user organisation
ownership.
