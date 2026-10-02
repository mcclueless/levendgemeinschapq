# Tasks

## 1. Wire the editor into the forms

- [x] 1.1 On the venue, organiser and project create pages
      (`src/app/beheer/nieuw/{locatie,organisator,project}/page.tsx`), replace
      the body `Textarea` with `BodyEditor`, passing the media pool the page
      already loads and keeping the project form's `min-h-64`. Verify that each
      page renders the toolbar and still posts `body`.
- [x] 1.2 In the venue, organiser and project branches of
      `src/app/beheer/[type]/[slug]/bewerken/page.tsx`, replace the body
      `Textarea` with `BodyEditor`, passing `pool` and
      `defaultValue={doc.body.trim()}`. Verify that the editor submits the same
      `body` field, with the same text, as the plain textarea did. (A save
      stores the browser's CRLF line endings and rewrites the frontmatter with
      or without the editor; see the proposal's follow-ups.)
- [x] 1.3 Remove `Textarea` imports that are no longer used, and update the
      `BodyEditor` doc comment, which says "event and blog forms". Verify that
      `pnpm lint` reports no unused import.
- [x] 1.4 Confirm the public submission form (`src/app/evenement-indienen`)
      still renders the plain textarea and its page loads no media pool.

## 2. Image references

- [x] 2.1 Add a test to `src/content/image-references.test.ts`: an image that
      appears only in a venue's, an organiser's or a project's body counts as
      in use and names that item. Verify that `pnpm test` passes.

## 3. Verify

- [x] 3.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`. All pass.
- [x] 3.2 In the running app, for one venue, one organiser and one project:
      format text with the toolbar, insert a gallery image with a description,
      open the preview, save, and check the public page shows the formatting
      and the image. Then try deleting that image in the gallery and check it
      is blocked and names the item.
