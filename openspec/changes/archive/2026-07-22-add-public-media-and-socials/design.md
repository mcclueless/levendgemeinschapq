## Context

Two admin-only mechanisms are about to become anonymously reachable. Neither was
built for that.

```
  ImageField (components/admin/image-field.tsx)
    ├─ <input type="file" name="image">              ← wanted publicly
    ├─ <input type="hidden" name="featuredImageUrl"> ← must NOT be honoured publicly
    └─ MediaPicker(pool)  ─ renders every uploaded image ← must not reach the public route

  saveUpload (content/media.ts:40)
    ├─ no size limit
    ├─ no content-type check
    ├─ no extension allowlist   (IMAGE_EXT exists but is used only by the
    │                            two LISTING functions, lines 120 and 144)
    └─ deterministic filename:  `${slug(base)}-${file.size}${ext}`
```

Both are currently safe by virtue of a single caller behind `assertAdmin()`. The
decision to give public submitters image and social parity removes that
guarantee, so the hardening is not an enhancement attached to this change — it is
the precondition for it.

## Goals / Non-Goals

**Goals:**

- Public submitters supply a cover image and social links, reviewed before
  publication like everything else.
- The image bank stays administrator-only to browse.
- The upload path becomes safe to expose anonymously.
- Social URLs stop being able to make a document unreadable.

**Non-Goals:**

- Public browse/pick/delete of library images.
- Any change to recurrence (separate change; the public narrowing there stands).
- Solving the general `parseAll`-silently-skips hazard (bug report item 4).

## Decisions

### D1 — Withhold the pool by not fetching it, not by hiding the button

The public page must not call `listMedia()` at all.

`ImageField` takes `pool: MediaItem[]` and renders it into a client component.
Removing the "Kies uit galerij" button while still passing `pool` would leave the
full list of every uploaded image — keys, sizes, URLs — serialized into the RSC
payload of an unauthenticated page. The absence must be at the data-fetch layer.

Concretely: an upload-only mode whose props make the pool *unrepresentable*
(no `pool` parameter at all), rather than an `allowPicker={false}` flag on the
existing component that still accepts one. If the type cannot express the leak,
a future edit cannot reintroduce it.

### D2 — The public action ignores `featuredImageUrl` entirely

The admin resolution order is deliberate and stays:

```js
featuredImageUrl ?? await saveUpload(form.get("image"))
```

The public action resolves `saveUpload(form.get("image"))` **only**. `str(form,
"featuredImageUrl")` is never read. Otherwise a hand-crafted POST sets the cover
to any URL at all — an existing library image, an off-site tracker, or arbitrary
remote content rendered on the site under the neighbourhood's name.

This mirrors the server-side enforcement pattern already agreed for the public
recurrence narrowing: the UI omission is a convenience, the server check is the
contract.

### D3 — Harden `saveUpload`, and treat the current naming scheme as a defect

Required before public exposure:

| Control | Rule |
|---|---|
| Extension allowlist | reuse/extend `IMAGE_EXT`, **minus SVG** — enforce it on save, not only on list |
| Declared content type | must be `image/*` and agree with the extension |
| Magic bytes | sniff the leading bytes; a `.jpg` that is not a JPEG is rejected |
| Size cap | **10 MB**, rejected with a message rather than truncated |
| Filename | non-guessable; drop the deterministic `${base}-${size}${ext}` scheme |

Two of these deserve their reasoning stated, because they are easy to argue away:

- **SVG is excluded for uploads.** It is in `IMAGE_EXT` today, and it is a
  scriptable document. Served from the site's own origin — which is exactly what
  `public/uploads/*` is locally — an SVG is a stored-XSS vector. Administrators
  are not a meaningful mitigation once anonymous upload exists, so the allowlist
  used on save must be narrower than the one used to list.
- **The current filename is an overwrite primitive.** `${slugify(base)}-${size}${ext}`
  is a pure function of attacker-controlled inputs. Any two files that slugify
  alike and share a byte length collide, and `write` overwrites unconditionally.
  Admin-only, that is a curiosity. Anonymous, it means a submitter can replace an
  existing cover image by crafting a file with a matching name and size.

### D4 — Validate socials on write, in both actions, with a scheme allowlist

Without this the feature does not merely degrade — it fails invisibly:

```
  submitter types "instagram.com/buurt"
        │
        ▼
  written to the pending document          "Dankjewel! Je evenement is ingediend"
        │
        ▼
  SocialsSchema.url() fails on read
        │
        ▼
  parseAll skips the document (parse.ts:53)
        │
        ▼
  getPendingSubmissions never sees it → the submission is not in the queue
        │
        ▼
  no administrator can approve it; the submitter is told it succeeded
```

So a validating parser is load-bearing, not defensive. It is shared by the public
and admin paths so the two cannot disagree, and it enforces a
`http`/`https` scheme allowlist — `z.string().url()` accepts
`javascript:alert(1)` (verified), and `social-links.tsx:46` renders `href`
unfiltered.

Normalising a scheme-less value to `https://` before validating is the friendly
behaviour and is preferred over rejecting, since a bare handle URL is the most
natural thing a submitter types. Rejection remains the fallback for values that
are still invalid after normalisation.

### D5 — Approval gates the event, not the upload

Worth stating plainly because it is counter-intuitive and does not have a clean
fix inside this change.

The file is written to storage at submission time. `status: "pending"` governs
whether the *event* is rendered; it does nothing about the *object*, which is
immediately fetchable at its public URL by anyone who knows or guesses it. So an
unapproved submission can host arbitrary (allowlist-passing) image content on the
project's own domain the moment it is submitted.

The extension/type/magic-byte controls in D3 bound what that content can be,
which is why they are prerequisites rather than polish. Genuinely closing the gap
would mean quarantining pending uploads in a non-public location and promoting
them on approval — a larger change, deliberately not attempted here. Flagged as
an accepted, bounded risk.

### D6 — Reviewers must see what was submitted

`PendingEvent` already carries `featuredImage`; the queue does not render it, and
socials are absent from the type entirely. If administrators are the control
point for anonymous images and links, the queue has to show both — approving
blind is not review.

## Risks / Trade-offs

- **Anonymous write access to storage.** New in kind, not just degree. Bounded by
  D3, but unbounded in volume: nothing here rate-limits submissions, and each one
  can carry a file up to the size cap. Worth a follow-up on submission throttling
  independent of this change.
- **Moderation burden shifts, it does not vanish.** The queue now carries images
  and links that need judging, not just text.
- **D5's accepted gap.** Pending uploads are publicly reachable before approval.
- **Wider allowlist on list than on save.** Existing SVGs in the bank stay
  listable and pickable by administrators while new SVG uploads are refused. That
  asymmetry is intentional but will look like a bug to whoever finds it next —
  worth a comment at both sites.
- **Two changes touch the public form.** This one and
  `add-recurrence-end-date` both add fields to `/evenement-indienen` and its
  action. Whichever lands second will have to merge the field group and the
  validation-error branches rather than adding a parallel set.

### D7 — Maximum upload size is 10 MB

Chosen to admit an ordinary phone photograph unmodified. A modern phone JPEG runs
roughly 8–12 MB, so a smaller cap (5 MB) would reject the most common submission
a neighbourhood group makes, and the failure would land on the least
technical users — exactly the people this change exists to serve.

The cap applies to **both** paths, public and administrator. A single number is
easier to state in an error message, easier to test, and avoids a second
configuration axis for no benefit; an administrator who needs a larger source
image can resize it, which is what they would have to do for the web anyway.

Enforced server-side in `saveUpload`. A client-side `accept` attribute or a size
check in the browser is a convenience only — same reasoning as D2.

**A 10 MB cap is not achievable without also raising Next's Server Action body
limit** — discovered during implementation, and it invalidates the naive reading
of this decision. `serverActions.bodySizeLimit` defaults to **1 MB**, and
`next.config.mjs` never set it. Anything larger is rejected by the framework
with a raw 500 *before* `saveUploadChecked` runs, so:

- the 10 MB cap was unreachable — nothing between 1 MB and 10 MB could ever be
  accepted, and the friendly "too large" message could never fire;
- **this was already broken for administrators**, not a new consequence of
  public uploads. Every cover image and media-library upload over 1 MB has been
  failing with an untranslated 500 for as long as the feature has existed. An
  ordinary phone photo never reached the upload code at all.

`next.config.mjs` now sets `serverActions: { bodySizeLimit: "12mb" }`,
deliberately **above** `MAX_UPLOAD_BYTES`. Multipart encoding plus the rest of
the form add overhead, and the gap is what lets *our* check reject an oversized
file with a message naming the limit instead of the framework rejecting the
request with a 500 nobody can translate.

The two numbers are coupled: raising the cap without raising the body limit
silently reintroduces the 500.

Consequence worth noting: 10 MB × unlimited anonymous submissions is unbounded
storage growth, and nothing in this change rate-limits submissions. The cap
bounds a single upload, not the aggregate. See Risks.

## Resolved Questions

- *What is the size cap?* **10 MB**, both paths (D7).
- *Should the public form offer the same recurrence frequencies as the backend?*
  **No** — non-repeating or weekly only. Decided in
  `openspec/changes/add-recurrence-end-date/` (design D7 there) and reaffirmed
  2026-07-22. This change does not revisit it.

## Open Questions

- Should an image be **required** for a public submission, as the recurrence end
  date now is? Current assumption: optional, matching the admin form.
- Should submissions be rate-limited before this ships, or is the approval queue
  considered sufficient deterrent for a neighbourhood-scale site? The 10 MB cap
  bounds one upload; it does not bound how many arrive.
