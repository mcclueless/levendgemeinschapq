## 1. Harden the upload path (blocking prerequisite)

> Nothing in groups 2–4 may ship before this group is complete. `saveUpload` is
> currently safe only because its single caller sits behind `assertAdmin()`.

- [ ] 1.1 Add an upload allowlist in `src/content/media.ts` enforced **on save** — note `IMAGE_EXT` exists today but is referenced only by the two listing functions (lines 120, 144), never by `saveUpload`
- [ ] 1.2 Exclude SVG from the **upload** allowlist while leaving it in the **listing** allowlist, and comment the asymmetry at both sites so it does not read as a bug (design D3)
- [ ] 1.3 Check the declared content type is an image type consistent with the extension
- [ ] 1.4 Sniff leading bytes and reject a file whose contents do not match its claimed format
- [ ] 1.5 Enforce a maximum file size of **10 MB**, applied to both the public and administrator paths, server-side in `saveUpload` (design D7)
- [ ] 1.6 Replace the deterministic `${slugify(base)}-${file.size}${ext}` filename with a non-guessable one, removing the overwrite primitive (design D3)
- [ ] 1.7 Return a distinguishable rejection reason (type / size / contents) so callers can report it rather than failing silently
- [ ] 1.8 Verify existing stored images and their frontmatter references still resolve after the naming change — the new scheme must apply to new uploads only

## 2. Shared social-URL validation

- [ ] 2.1 Add a validating socials parser used by **both** actions: normalise a scheme-less value to `https://`, then validate, then restrict to `http`/`https` (design D4)
- [ ] 2.2 Replace `socialsFrom` in `src/app/beheer/actions.ts` with it, returning a per-platform error rather than writing an invalid value
- [ ] 2.3 Confirm `javascript:alert(1)` is rejected — it currently **passes** `z.string().url()` and `src/components/content/social-links.tsx:46` renders `href` unfiltered
- [ ] 2.4 Cross-check `docs/bugs/invalid-social-url-hides-event.md`: this group fixes the admin symptom as a side effect. Re-verify the report and note what remains (the `parseAll` silent-skip hazard is **not** addressed here)

## 3. Upload-only image field

- [ ] 3.1 Add an upload-only mode to `src/components/admin/image-field.tsx`, or a sibling component, that takes **no `pool` parameter at all** — make the leak unrepresentable in the type rather than gated by a boolean flag (design D1)
- [ ] 3.2 Ensure it renders no picker, no dialog, and no image count
- [ ] 3.3 Confirm it emits no `featuredImageUrl` hidden input, or that any value it emits is ignored server-side (group 4)

## 4. Public form and action

- [ ] 4.1 Add the upload-only image field to `src/app/evenement-indienen/page.tsx`
- [ ] 4.2 Confirm the page does **not** import or call `listMedia()` — hiding the button is insufficient; an unused `pool` prop would still serialize the whole library into the payload of an unauthenticated page (design D1)
- [ ] 4.3 Add `<SocialFields />` to the public form, reusing `src/components/admin/social-fields.tsx`
- [ ] 4.4 In `src/app/evenement-indienen/actions.ts`, resolve the cover with `saveUpload(form.get("image"))` **only** — never read `featuredImageUrl` (design D2)
- [ ] 4.5 Parse socials with the shared validating parser and include both `featuredImage` and `socials` in the pending document, leaving `status`, `submittedBy`, `submittedAt` untouched
- [ ] 4.6 Report upload and social validation failures on the form, extending the existing `params.error` banner rather than adding a parallel mechanism
- [ ] 4.7 Reconcile with `openspec/changes/add-recurrence-end-date/` — both changes add fields and error branches to this same form and action; whichever lands second merges rather than duplicates (design "Risks")

## 5. Approval queue visibility

- [ ] 5.1 Add `socials` to `PendingEvent` in `src/content/admin.ts` (`featuredImage` is already carried but unrendered)
- [ ] 5.2 Render the featured image and the social links on the queue entry in `src/app/beheer/queue/page.tsx`, handling the no-media case without layout breakage

## 6. Verification

- [ ] 6.1 Upload a valid JPEG/PNG/WebP from the public form — confirm it is stored, attached to the pending event, and visible in the queue
- [ ] 6.2 Attempt an SVG upload from both the public and admin forms — confirm both are refused, and that an SVG already in the bank is still listable and pickable by an admin
- [ ] 6.3 Rename a `.txt` or `.html` file to `.jpg` and upload it — confirm the magic-byte check rejects it
- [ ] 6.4 Upload a file over 10 MB — confirm rejection with a message naming the limit, not a truncated or partial write
- [ ] 6.4a Upload a typical unmodified phone photograph (~8–12 MB) — confirm one just under the cap is accepted, since rejecting ordinary submissions would defeat the change
- [ ] 6.5 Upload two different files crafted to produce the same old-scheme filename — confirm both survive (task 1.6)
- [ ] 6.6 POST `featuredImageUrl` directly at the public action pointing at an existing library image and at an off-site URL — confirm neither is honoured
- [ ] 6.7 View source / inspect the RSC payload of `/evenement-indienen` — confirm no library image URLs, keys, or counts appear anywhere
- [ ] 6.8 Submit `instagram.com/buurt` — confirm it is normalised to `https://instagram.com/buurt`, stored, and that the submission **appears in the approval queue** (today this class of value makes the document unparseable and the submission invisible)
- [ ] 6.9 Submit `javascript:alert(1)` in a social field — confirm rejection on both the public and admin paths
- [ ] 6.10 Approve a submission carrying an image and socials — confirm both survive publication and render on the event page
- [ ] 6.11 Confirm existing events and organisers with valid socials are unaffected
- [ ] 6.12 Run `pnpm typecheck` and `pnpm test`
