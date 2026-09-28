## Why

An editor finds the backend hard to write in, and cannot reliably get an image
into a post. The body of an event or a blog post is a bare text box marked
"Markdown/MDX ondersteund", with no formatting help and no way to see the result
before saving. Putting an image in the text means uploading it in the gallery,
digging its address out of the browser (the gallery shows no URL and has no copy
button), typing `![beschrijving](url)` from memory, and checking the public page
afterwards.

The editor wants to add an image, not to size or position it. The page layout
already places images. A toolbar and a preview are enough; a full visual editor
is not needed.

## What Changes

- The **body field on the event and blog create and edit forms** gains a toolbar:
  bold, italic, heading, bulleted list, numbered list, link, and image. Each
  button writes the Markdown for the editor. The field stays a text box, so
  stored content does not change, and it still works as a plain field without
  JavaScript.
- The **image button** opens the gallery picker the cover field already uses,
  with an option to upload a new image on the spot. It asks for a description
  for screen readers, requires one, and inserts the image at the cursor as its
  own paragraph. The editor never sees or copies an address.
- A **preview** shows the body rendered by the site's own renderer, embeds such
  as `<UpcomingEvents>` included, so what the editor sees is what the page shows.
  A body that cannot be rendered is reported in the preview instead of being
  discovered on the public page.
- **Deleting a gallery image** also checks the text of every content item for
  the image, as well as the covers of projects, which the check misses today.
  An image used inline can no longer be deleted out from under a post.

Not in scope: a visual (WYSIWYG) editor, image size or position controls,
captions, dragging or pasting images into the text, the toolbar on venue,
organiser and project forms, and any change to the public submission form.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editorial-backend`:
  - New requirement: **body editing aids** on the event and blog forms, a
    toolbar and a preview.
  - New requirement: **inserting an image into a body**, from the gallery or by
    uploading, with a required description.
- `media-library`:
  - **Reference-safe image deletion**: an image used in any item's text, or as a
    project's cover, counts as in use.

## Impact

- `src/components/admin/`: a body-editor client component (toolbar, image
  dialog, preview toggle). The gallery picker in `image-field.tsx` becomes
  shareable.
- `src/app/beheer/actions.ts`: an upload action that returns the stored URL
  rather than redirecting, and a preview action that renders a body for an
  administrator.
- `src/components/mdx/mdx.tsx`: rendered by the preview through the same
  pipeline as the public page.
- `src/content/admin.ts`: `findImageReferences` scans bodies of all content
  types and project covers.
- The event and blog create and edit pages use the new component. Venue,
  organiser, project and public forms are unchanged.
- No change to stored content, the schema, or the public site. No new
  dependency.
