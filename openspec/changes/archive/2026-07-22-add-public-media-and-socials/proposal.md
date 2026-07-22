## Why

Public event submitters can supply title, dates, venue, organiser, excerpt and
body — but not a cover image and not social links. An administrator therefore
approves a bare event and has to go re-edit it to add the picture and the
Instagram link the submitter already had. The submitter is the person who *has*
those things; withholding the fields creates editorial work rather than
preventing it.

Decision taken 2026-07-22: **public submitters get the same featured image and
the same social links as administrators.** The one deliberate asymmetry is the
media library — a public submitter may **upload** a picture, but may **not browse
the image bank**.

That asymmetry is not cosmetic. The existing `ImageField` receives the entire
media pool as a prop and the existing `saveUpload` accepts any file of any size
and any type. Both are safe today only because the sole caller sits behind
`assertAdmin()`. Opening them to anonymous visitors changes the threat model
completely, so this change is as much about hardening the upload path as it is
about adding two fields.

## What Changes

- Add a **featured image** field to the public submission form at
  `/evenement-indienen`, in **upload-only** mode: a file input, no "Kies uit
  galerij" button, no picker dialog.
- Add the same **social media link inputs** administrators have (the existing
  `SOCIAL_PLATFORMS` set) to the public form.
- **Never load the media pool on the public route.** `listMedia()` is not called
  and no pool is passed to the client — hiding the button is not sufficient,
  since the pool would otherwise be serialized into the page payload.
- **Ignore `featuredImageUrl` in the public action.** The admin action resolves
  `featuredImageUrl ?? saveUpload(image)`; the public action SHALL resolve
  `saveUpload(image)` only, so a hand-crafted POST cannot set an arbitrary cover
  URL.
- **Harden `saveUpload` before it is reachable anonymously** — an extension and
  content-type allowlist, a magic-byte check, a **10 MB** maximum file size
  (sized to admit an unmodified phone photograph), SVG excluded, and
  non-guessable stored filenames.
- **Validate social URLs in both actions before writing**, with a scheme
  allowlist. Without this, a submitter typing `instagram.com/buurt` produces a
  document that fails read validation and is silently skipped by `parseAll` —
  the submission never reaches the approval queue at all. See
  `docs/bugs/invalid-social-url-hides-event.md`.
- Show the submitted cover image and social links on the **approval queue** entry
  so an administrator reviews what was actually submitted.

## Capabilities

### Modified Capabilities

- `editorial-backend`: The public event submission form accepts a featured image
  by upload and the full set of social media links. Uploads from the public form
  are validated by type and size, and the form cannot reference an existing
  library image. Social URLs are validated at submission time on both the public
  and administrator paths. The approval queue displays a submission's cover image
  and social links.
- `media-library`: The image bank remains administrator-only to browse. Uploading
  from the public submission form adds to the same store but SHALL NOT expose any
  listing of it, and SHALL be constrained by an allowlist and a size limit that
  do not apply to the browse-and-pick flow.

## Impact

- **Public form**: `src/app/evenement-indienen/page.tsx` — a file input and the
  social fields; must **not** import or call `listMedia()`.
- **Shared components**: `src/components/admin/image-field.tsx` gains an
  upload-only mode (or a sibling component) that renders no picker and takes no
  `pool`; `src/components/admin/social-fields.tsx` is reused as-is.
- **Public action**: `src/app/evenement-indienen/actions.ts` — resolve the cover
  via `saveUpload` only, parse and validate socials, write both into the pending
  document.
- **Upload path**: `src/content/media.ts` — `saveUpload` gains validation and
  non-guessable naming. Note `IMAGE_EXT` currently exists but is used **only** by
  the two listing functions (lines 120, 144), never on save.
- **Socials validation**: `src/app/beheer/actions.ts` (`socialsFrom`) and the new
  public equivalent share one validating parser.
- **Approval queue**: `src/content/admin.ts` (`PendingEvent` gains socials;
  `featuredImage` is already carried) and `src/app/beheer/queue/page.tsx`.
- **Storage**: anonymous writes now reach `public/uploads` locally and the S3
  media bucket in deployment.

## Non-Goals

- **Public browsing of the image bank.** Explicitly withheld. `media-library`
  stays administrator-only to list.
- **Public submission of venues, organisers, projects, or blog posts.** Unchanged.
- **Deleting or replacing an uploaded image from the public form.** One upload
  per submission; corrections go through an administrator.
- **Fixing the pre-existing social-URL defect on its own terms.** This change
  must validate socials to function, which incidentally fixes the admin symptom
  too — but the full analysis, including the `javascript:` scheme hole and the
  systemic `parseAll` skip hazard, stays in
  `docs/bugs/invalid-social-url-hides-event.md`.
- **Recurrence.** Handled in `openspec/changes/add-recurrence-end-date/`, where
  the public form is deliberately narrower (weekly only). This change does **not**
  revisit that narrowing.
