## 1. The control (D1, D2, D3)

- [x] 1.1 In `src/components/admin/media-uploader.tsx`, render the enhanced
      branch as a primary `Button` "Afbeeldingen uploaden" that opens a hidden
      (`sr-only`, `tabIndex={-1}`, `aria-hidden`) multiple file input, disabled
      and relabelled while busy; keep the no-script branch (label, visible
      input, "Uploaden") as is. Verify with `pnpm typecheck` and `pnpm lint`.
- [x] 1.2 Read the empty-pool hint in `src/components/admin/image-field.tsx`,
      find the control it refers to, and make the quoted name match that
      control's label. Verify by grepping that no text still says
      “Nieuwe afbeelding” as a label name unless a control carries it.

## 2. Verify

- [ ] 2.1 In the running backend gallery: the button shows the hand pointer
      and the primary style, pressing it opens the chooser, choosing two files
      uploads both and lists both results, dropping a file still works, and
      the button is disabled while uploading. With scripts off, the plain form
      uploads one file.
- [ ] 2.2 After deploy, upload one image on goeddoen.net's gallery through the
      button, then delete it.
