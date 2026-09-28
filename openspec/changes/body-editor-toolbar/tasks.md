## 1. Preview mechanism (D5)

- [x] 1.1 Spike: confirm a server action can return `<Mdx>` output, including an
      embedded `<UpcomingEvents>`, and that a compile error can be caught and
      returned as data. If not, switch to the iframe route in D5 and update the
      design before continuing.
- [x] 1.2 Add `previewBody(source)`: admin-only, same renderer as the public
      pages, a render failure returned as `{ error }`.
- [x] 1.3 Check what a body the renderer rejects does to its public page today,
      and record the answer on the open question in the design.

## 2. Toolbar (D1, D2)

- [x] 2.1 Write the toolbar transforms as pure functions, with tests: each action
      with and without a selection, multi-line prefixes, and the rest of the text
      unchanged.
- [x] 2.2 Build `BodyEditor` over the existing `textarea name="body"`: toolbar
      group labelled "Opmaak", `Ctrl/Cmd+B` and `+I`, inserts through
      `execCommand("insertText")` with a fallback, uncontrolled value.
- [x] 2.3 Add the preview toggle: the textarea hidden but mounted, the rendered
      body or the error shown in its place, `aria-pressed` on the toggle.

## 3. Image insertion (D3, D4)

- [x] 3.1 Export `MediaPicker` from `image-field.tsx` without changing the cover
      field's behaviour.
- [x] 3.2 Add `uploadInlineImage(formData)`: admin-only, `saveUploadChecked`,
      returns the URL or the reason.
- [x] 3.3 Build the image dialog: pick from the pool or upload, a required
      description, insertion at the cursor as its own paragraph. Test the insert
      transform, including escaping brackets in the description and collapsing
      blank lines.
- [x] 3.4 Show upload rejections in the dialog with the existing messages.

## 4. Wire into the forms

- [x] 4.1 Use `BodyEditor` on the event create and edit forms and the blog create
      and edit forms, passing the media pool.
- [x] 4.2 Confirm venue, organiser, project and public forms still render the
      plain textarea, and the public page payload still carries no pool.

## 5. Reference-safe deletion (D6)

- [x] 5.1 Extend `findImageReferences` to projects, and to the body of every
      content type. Test a body reference, a project cover, and an unrelated
      image that is still deletable.
- [x] 5.2 Update the gallery's in-use message and comments that describe the
      check as covers and galleries only.

## 6. Verify

- [x] 6.1 Run `pnpm test`, `pnpm typecheck` and `pnpm lint`.
- [x] 6.2 Check in a browser against the running app, on a blog post and on an
      event:
      - Each toolbar action works on a selection and on an empty cursor, and
        undo reverses an insert.
      - An image from the library and a freshly uploaded one each insert as
        their own paragraph with their description, and render on the page.
      - Confirming without a description is refused; a rejected upload is
        reported and inserts nothing.
      - The preview matches the public page, including `<UpcomingEvents>`, and a
        broken body shows the error instead.
      - Everything is reachable and operable by keyboard; controls have names.
      - With JavaScript off the form still saves the body.
      - The gallery refuses to delete an image used inline, and names the item.
