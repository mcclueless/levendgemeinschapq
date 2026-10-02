## Context

Bodies are MDX, stored as the document text below the frontmatter, and rendered
on the server by `next-mdx-remote` (v6, RSC) with one embeddable component,
`<UpcomingEvents>`. Every admin form edits the body in a plain `<textarea>`.

```
 today                                      after
 ─────                                      ─────
 textarea ─▶ server action ─▶ .mdx          toolbar + textarea ─▶ server action ─▶ .mdx
                                               │   ▲                (unchanged)
                                               │   └─ insert ![alt](url)
                                               ├─▶ image dialog ─▶ gallery pool / upload action
                                               └─▶ preview ─▶ preview action ─▶ <Mdx> (same renderer)
```

Constraints:
- Stored content must not change shape. The toolbar only writes Markdown text.
- The backend is server-rendered forms that work without JavaScript. The body
  must stay a plain, submittable field.
- `UpcomingEvents` is an async server component, so a body can only be rendered
  on the server. A client-side Markdown renderer would not match the page.
- There is no error page for events or posts, so a body the renderer rejects
  most likely fails the whole public page.
- The gallery pool must not reach unauthenticated pages (media-library spec).
  Every surface here is admin-only.

## Goals / Non-Goals

**Goals:**
- An editor formats text and inserts an image without knowing Markdown syntax
  or an image's address.
- An editor sees the rendered body before saving, identical to the public page.
- An image used inline cannot be deleted from the gallery by accident.

**Non-Goals:**
- A visual editor. Size, position and captions for images. Drag, drop or paste
  uploads.
- The toolbar on venue, organiser and project forms, or on the public form.
- Refusing to save a body that cannot be rendered (see Open Questions).

## Decisions

### D1. Progressive enhancement over the existing textarea

`BodyEditor` is a client component that renders the same
`<textarea name="body">` with a toolbar above it. The server renders the
textarea with its value, so without JavaScript it is exactly today's field. The
toolbar edits `value` and the selection through the DOM, then fires an `input`
event, so the textarea stays uncontrolled and the form posts it unchanged.

*Alternative: a visual editor (MDXEditor, Tiptap).* Rejected for this change: the
editor asked only for a toolbar and preview. A visual editor would also rewrite
existing Markdown on first save, and add a large script to the backend.

### D2. Toolbar actions are pure text transforms

Each button maps to a pure function `(text, selStart, selEnd) → { text,
selStart, selEnd }`:

| Button | With a selection | With no selection |
|---|---|---|
| Vet | `**sel**` | `**tekst**`, placeholder selected |
| Cursief | `*sel*` | `*tekst*` |
| Kop | `## ` prefix on the selected lines | `## ` on the current line |
| Opsomming, Nummering | `- ` or `1. ` prefix per line | on the current line |
| Link | `[sel](https://)`, the URL selected for typing | `[linktekst](https://)` |

Pure functions keep the rules unit-testable without a browser. Undo is left to
the browser. Replacing the value directly clears native undo in some browsers,
so where supported the insert goes through `document.execCommand("insertText")`,
which keeps it, with a direct replacement as fallback. `Ctrl/Cmd+B` and `+I`
apply bold and italic.

The toolbar is a `role="toolbar"` group labelled "Opmaak", with a native button
per action, each with a visible text or an `aria-label`. It uses plain Tab
order, not a roving focus, to keep it simple.

### D3. The image dialog reuses the gallery picker

The `MediaPicker` in `image-field.tsx` is exported and reused. The image button
opens it with two additions:
- an "Nieuwe afbeelding uploaden" file input, which calls an upload action and
  selects the result;
- a required "Beschrijving (voor schermlezers)" field.

On confirm it inserts `\n\n![beschrijving](url)\n\n` at the cursor, collapsing
surplus blank lines, so the image is its own paragraph and the layout places it.
Brackets in the description are escaped so it cannot break the syntax.

The pool of images is passed from the page, as for the cover field. The event
and blog pages already load it.

### D4. An upload action that returns the URL

`uploadInlineImage(formData)` asserts admin, runs `saveUploadChecked`, and
returns `{ ok: true, url }` or `{ ok: false, reason }` instead of redirecting.
The dialog shows the reason with the existing upload messages. Validation,
storage and naming are those of every other upload, and the image appears in
the gallery.

### D5. Preview through a server action that returns rendered output

`previewBody(source)` asserts admin and returns `<Mdx source={source} />`, the
same component the public pages use. A server action can return server-rendered
React output to the client, so `UpcomingEvents` resolves exactly as on the page.
A render failure is caught and returned as `{ error }`. The preview then shows
"Deze tekst kan niet worden weergegeven" with the renderer's message, and no
partial output.

The preview is a toggle, "Voorbeeld tonen" with `aria-pressed`, that swaps the
textarea for the rendered body inside the same field, and back. The textarea
stays mounted and hidden, so its value and selection survive. A toggle avoids
the arrow-key behaviour tab widgets require.

*Fallback, if returning rendered output from an action proves unreliable in
this Next.js version:* an admin-only route that renders the body as a page,
shown in an `<iframe>`, with the source passed through a short-lived stored
draft. Task 1.1 settles this before the component is built.

Rendering editor text is no new exposure. It is the same pipeline, with the
same MDX settings, that already renders the saved body, and only an
administrator can call it.

### D6. The reference scan covers bodies and project covers

`findImageReferences` loads all five content types, and treats an item as a
reference when its cover equals the URL, a venue gallery includes it, or its
body contains the URL. A substring match on the exact URL is enough: media
filenames are unguessable and unique, so a false positive would need the URL
itself to appear in the text, which is a real use.

## Risks / Trade-offs

- **[Returning rendered output from a server action]** The approach is supported
  but less common than returning data. → Spike first (task 1.1), with the iframe
  route as a defined fallback.
- **[Native undo lost on insert]** → `execCommand("insertText")` where available,
  and a test in the browser check.
- **[Preview cost]** Each preview compiles MDX and may query upcoming events. →
  Only on an explicit toggle, never per keystroke.
- **[Scan cost on delete]** Reading every document on each delete. → Deletes are
  rare, and the scan already reads four of the five types.
- **[Upload without a document]** An image uploaded from the dialog and then not
  inserted stays in the gallery unused. → Acceptable: it can be deleted from the
  gallery, which is what "unused" means there.

## Migration Plan

No data changes. Deploy, then on a test blog post: format some text, insert one
library image and one uploaded image, preview, save, and check the public page
and the gallery's deletion guard. Rollback is a revert.

## Open Questions

- Should saving refuse a body the renderer rejects? The preview reports it, but a
  save still succeeds. Task 1.3 confirmed the cost: such a body makes its own
  public page return a server error (500), while listings keep working. That is
  a guard on the save path, and the public submission form writes bodies too, so
  it belongs in its own change if wanted.

## Findings during implementation

- **Spike (task 1.1):** a server action returning the output of `compileMDX`
  works, embedded `<UpcomingEvents>` included, and a compile error is caught in
  the action and returned as data. D5's main path holds; the iframe fallback is
  not needed.
- **Embed props in braces are dropped (pre-existing, out of scope):** the MDX
  library's default `blockJS` strips JavaScript expressions, so
  `<UpcomingEvents limit={3} />` loses its `limit`. The live "Welkom" post asks
  for three events and shows six. The preview reproduces this faithfully,
  because it shares the pipeline. Fixing it means either string props
  (`limit="3"`) accepted by the component, or relaxing `blockJS` — a separate
  change.
- **Tester feedback, 2026-09-29: black bars around an inserted image.** Adding
  an image works. The bars on `/agenda/celebrations-koor-20-jaar-jubileumsconcert`
  are in the uploaded file: a 739×1600 phone screenshot with 277 px of solid
  black above and below the poster. The site renders it as stored. Possible
  follow-ups, not in this change: a hint in the image dialog to prefer the
  original file, trimming uniform borders on upload, and a maximum height for
  inline images so tall portrait posters fit one screen.
