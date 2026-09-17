## 1. One reference table (D1, D2)

- [x] 1.1 In `src/content/admin.ts`, describe inbound references once as data: for
      Events, Projects, Blog posts, Organisers, and feeds, record the store prefix
      and which fields hold Venue slugs and Organiser slugs, marking the array
      fields (`Project.organisers`, `Blog.relatedVenues`,
      `Blog.relatedOrganisers`).
- [x] 1.2 Add a pure `rewriteReferences(frontmatter, kind, type, from, to)` that
      returns the patched frontmatter, or `null` when nothing points at `from`.
      It must replace matching array elements in place, keep their order, and
      change no other field.
- [x] 1.3 Unit-test `rewriteReferences` in the style of `write.test.ts`: every row
      of the table for both Venue and Organiser; array fields holding several
      slugs; a title or excerpt containing the old slug text is left alone; and an
      already-rewritten document returns `null`.
- [x] 1.4 Rebuild `findReferences` on the table. Add Projects and Organiser
      locations for both hide and delete, and feeds only when `includeHidden` is
      set. Widen `ContentReference.kind`, and give feed references their backend
      edit URL as `href`.
- [x] 1.5 Check the blocked-hide and blocked-delete messages on
      `src/app/beheer/[type]/page.tsx` render the new kinds correctly, including a
      feed reference.
- [x] 1.6 Verify against a scratch copy of `content/`: a Venue used only by a
      Project, one used only as an Organiser's location, and one used only as a
      feed default. Deleting each must be refused, naming the referrer. Hiding
      must be refused for the first two and allowed for the feed-only one.

## 2. The rename operation (D3, D4, D5)

- [x] 2.1 Add the rename operation over the store, restricted to `venue`,
      `organiser`, and `project`. Normalise with `slugify`, and return a typed
      refusal (`empty`, `unchanged`, `taken`) instead of throwing, for the action
      to map to a message.
- [x] 2.2 Implement the order from D3: copy the document to the new key; patch
      every referrer that `rewriteReferences` changes, including feeds via
      `updateFeed`; remove the old key last. Return the rewritten referrers for
      revalidation.
- [x] 2.3 Implement resume per D4: when both keys exist with identical contents,
      continue from the rewrite step instead of refusing as `taken`.
- [x] 2.4 Verify end to end against a scratch copy of `content/` with a local
      store:
      - Rename a Venue referenced by every row of the table, in mixed statuses.
        Every reference must name the new slug, no other field may change, the old
        file must be gone, and `parseAll` must still load every document.
      - Rename a Project; its body, status, and `date` must be unchanged.
      - Refuse empty, unchanged, and taken requests, including a slug held by a
        hidden item; the store must be byte-identical afterwards.
- [x] 2.5 Verify the retry: stop the operation after the copy and after half the
      referrers, then repeat the same request. It must finish, and at no point may
      a reference name a slug with no document.

## 3. Backend action and form (D6, D7)

- [x] 3.1 Add a `changePermalink` server action in `src/app/beheer/actions.ts`.
      Gate it with `assertAdmin()`, accept only the three types, and on refusal
      redirect back to the edit page with `?permalink=empty|unchanged|taken`.
- [x] 3.2 On success, revalidate the old and new item paths, the listings, and
      each rewritten referrer's detail path. Refresh the backend list, then
      redirect to the new edit URL.
- [x] 3.3 On the edit page for Location, Organiser, and Project only, add a
      separate permalink form. It holds the current slug and previews the public
      URL that will result, says in Dutch that the old URL will stop working, and
      shows a specific message for each refusal. Events and Blog posts show no
      permalink form.
- [x] 3.4 Run `pnpm test`, `pnpm typecheck`, and `pnpm lint`.
- [x] 3.5 Run the app locally against `content/`. Rename a seed Venue from its edit
      page, then check: the new public URL renders; the old one returns not found;
      an Event at that Venue links to the new URL; and the browser lands on the
      new edit page.

## 4. Specs and release

- [x] 4.1 Sync the `editorial-backend` delta into `openspec/specs/`, and validate
      with `openspec validate --specs`.
- [ ] 4.2 After deploy, from the production backend: rename `/projecten/asdfasdf`,
      and rename `/locaties/thee-resia-samentuin-2`. If `thee-resia-samentuin` is
      refused as taken, report which hidden item holds it rather than choosing
      another slug. Confirm the old URLs 404 and the project and organiser pages
      link to the new Location URL.
