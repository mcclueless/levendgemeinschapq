## Why

Events and blog posts have a body editor with a toolbar, an image control and
a preview. The description of a location, an organiser or a project is still a
bare text box. An editor who has learned the toolbar on one form finds it
missing on the next, and still cannot get an image into these descriptions
without typing Markdown by hand. `body-editor-toolbar` left these forms out of
scope; the editor now wants them to work the same way.

## What Changes

- The **description field on the Location (venue), Organiser and Project create
  and edit forms** gets the same body editor the event and blog forms use:
  - the toolbar for bold, italic, heading, lists and links
  - the image control: pick from the gallery or upload, with a required
    description
  - the preview, rendered by the site's own renderer
- All five backend content types then edit their body the same way. Without
  JavaScript the field is still a plain text box.
- The public event submission form keeps its plain text box.

Not in scope:
- a visual (WYSIWYG) editor
- the follow-ups recorded in `body-editor-toolbar`'s design notes: a hint about
  black bars, trimming image borders, a maximum height for inline images, and
  the lost `limit` on `<UpcomingEvents>`
- rewording the field hint "Markdown/MDX ondersteund."; it stays as it is on all
  forms
- the public submission form

Found while verifying, left for a separate change: saving any content item
stores the body with the CRLF line endings browsers submit, and rewrites the
frontmatter in the serializer's own style, so an unchanged save still changes
the file. This predates the editor, affects all five content types, and does
not change what the public pages show.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editorial-backend`:
  - **Body editing aids** apply to the body field of every backend content form
    (Event, Blog post, Venue, Organiser, Project), not only events and blog
    posts. The requirement is renamed to match, and its "other forms unchanged"
    scenario now covers only the public submission form.
  - **Inserting an image into a body** applies to the same forms.

## Impact

- `src/app/beheer/nieuw/locatie/page.tsx`, `organisator/page.tsx`,
  `project/page.tsx`: the body `Textarea` becomes `BodyEditor`.
- `src/app/beheer/[type]/[slug]/bewerken/page.tsx`: the same swap in the
  venue, organiser and project branches.
- `src/components/admin/body-editor.tsx`: the doc comment that says "event and
  blog forms" is updated.
- No new server action, no storage, schema or public-page change, no new
  dependency. The preview and upload actions are already independent of content
  type, the public pages for all three types already render their body with the
  same `<Mdx>`, and the image-in-use check already scans every content type's
  body.
