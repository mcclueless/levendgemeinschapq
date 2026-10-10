"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ADMIN_HINT_COOKIE,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  checkAdminPassword,
  createSessionToken,
} from "@/lib/auth";
import { isAdmin } from "@/lib/auth-server";
import {
  createDocument,
  purgeDocument,
  listTrash,
  restoreDocument,
  setStatus,
  trashDocument,
  updateDocument,
} from "@/content/write";
import {
  findImageReferences,
  findReferences,
  getEditable,
  loadImageUsers,
} from "@/content/admin";
import { deleteMedia, listMedia, replaceMedia, saveUploadChecked } from "@/content/media";
import {
  loadMediaDetails,
  mediaName,
  removeMediaDetails,
  saveMediaDetails,
  updateMediaDetails,
} from "@/content/media-details";
import { imageUsage } from "@/content/image-references";
import {
  ADMIN_FREQUENCIES,
  recurrenceFromForm,
  type RecurrenceFormResult,
} from "@/content/recurrence-form";
import { socialsFromForm } from "@/content/socials-form";
import {
  datesFromForm,
  readEventMode,
  validateEventRange,
} from "@/content/event-form";
import { organiserFields } from "@/content/event-organisers";
import { organiserImageFields } from "@/content/organiser-images";
import { geocode, type GeocodeResult } from "@/content/geocode";
import { syncFeed, type SyncResult } from "@/content/ical-import";
import {
  createFeed,
  deleteFeed,
  getFeed,
  listFeeds,
  updateFeed,
} from "@/content/feeds";
import {
  revalidateAfterItemChange,
  revalidateAfterPermalinkChange,
  revalidateContent,
  revalidatePublic,
} from "@/content/revalidate";
import {
  changePermalink as changeStoredPermalink,
  isPermalinkType,
} from "@/content/permalink";
import { adminEditPath, adminListPath, publicListPath } from "@/lib/routes";
import { siteInputToIso } from "@/lib/date";
import { returnPath, withParam } from "@/lib/return-path";

type ManagedType = "event" | "venue" | "organiser" | "blog" | "project";

function managedType(form: FormData): ManagedType | undefined {
  const t = str(form, "type");
  return t === "event" ||
    t === "venue" ||
    t === "organiser" ||
    t === "blog" ||
    t === "project"
    ? t
    : undefined;
}

/**
 * Where a backend action lands when it is done: the list view it was started
 * from, sent along as `terug`, or else the type's list (admin-content-table D6).
 */
function listBack(type: ManagedType, form: FormData): string {
  return returnPath(form.get("terug"), adminListPath(type));
}

/** An item's edit form, still carrying the list view to return to after saving. */
function editBack(type: ManagedType, slug: string | undefined, form: FormData): string {
  const path = adminEditPath(type, slug ?? "");
  const terug = str(form, "terug");
  return terug ? withParam(path, "terug", terug) : path;
}

function str(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/**
 * Resolve a cover image from a content form (cover-image-bank): a picked
 * existing image (`featuredImageUrl`) wins over a newly uploaded file, which
 * only then is stored. Returns undefined when neither is provided — callers
 * preserve the existing cover on edit.
 */
async function coverImage(
  form: FormData,
  back: string,
  fields: { url: string; file: string } = { url: "featuredImageUrl", file: "image" },
): Promise<string | undefined> {
  const picked = str(form, fields.url);
  if (picked) return picked;
  const result = await saveUploadChecked(form.get(fields.file));
  if (!result.ok) redirect(withParam(back, "error", result.reason));
  return result.url;
}

/** Geocode-outcome flag for editor feedback (venue-address-geocoding). */
function geoFlag(
  address: string | undefined,
  geo: GeocodeResult | null,
): string | undefined {
  if (!address) return undefined;
  return geo ? "ok" : "notfound";
}

/** Coordinates from an autocomplete selection (venue-address-autocomplete). */
function pickedCoords(form: FormData): { lat: number; lng: number } | null {
  const latS = str(form, "addrLat");
  const lngS = str(form, "addrLng");
  if (!latS || !lngS) return null;
  const lat = Number(latS);
  const lng = Number(lngS);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const password = str(formData, "password") ?? "";
  const next = str(formData, "next") ?? "/beheer";
  if (!checkAdminPassword(password)) {
    redirect(`/beheer/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const token = await createSessionToken();
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  // Client-readable hint (admin-presence): lets the public footer + banner
  // reveal admin UI without server-rendering session state. Not httpOnly by
  // design; it is only a hint — real auth stays in SESSION_COOKIE.
  jar.set(ADMIN_HINT_COOKIE, "1", {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  redirect(next);
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(ADMIN_HINT_COOKIE);
  redirect("/beheer/login");
}

// ── Approval queue ───────────────────────────────────────────────────────────
async function assertAdmin() {
  if (!(await isAdmin())) redirect("/beheer/login");
}

export async function approveSubmission(formData: FormData) {
  await assertAdmin();
  const type = str(formData, "type") as "event" | "blog";
  const slug = str(formData, "slug");
  if (!slug || (type !== "event" && type !== "blog")) return;
  await setStatus(type, slug, "published", { reviewNote: undefined });
  await revalidatePublic();
  revalidatePath("/beheer/queue");
  revalidatePath("/beheer");
}

export async function rejectSubmission(formData: FormData) {
  await assertAdmin();
  const type = str(formData, "type") as "event" | "blog";
  const slug = str(formData, "slug");
  const note = str(formData, "note");
  if (!slug || (type !== "event" && type !== "blog")) return;
  await setStatus(type, slug, "draft", { reviewNote: note });
  revalidatePath("/beheer/queue");
  revalidatePath("/beheer");
}

/**
 * Curated social links from a content form (editorial-enrichments), normalised
 * and validated before they are written. Writing an unvalidated URL used to
 * make the whole document unreadable, which removed it from the site *and* the
 * backend list (docs/bugs/invalid-social-url-hides-event.md). The caller
 * redirects with `?error=socials-<platform>` on failure.
 */
function socialsOrRedirect(form: FormData, back: string) {
  const result = socialsFromForm(form);
  if (!result.ok) redirect(withParam(back, "error", `socials-${result.platform}`));
  return result.socials;
}

// ── Content creation (admin) ─────────────────────────────────────────────────

/**
 * Recurrence from an admin event form. The backend offers both intervals; the
 * end date is required whenever one is chosen (add-recurrence-end-date D5).
 * Validation lives in the shared parser so this path cannot drift from the
 * public submission form.
 */
function adminRecurrence(form: FormData, start: string | undefined): RecurrenceFormResult {
  return recurrenceFromForm(
    form,
    start ? new Date(siteInputToIso(start)!) : undefined,
    ADMIN_FREQUENCIES,
  );
}

export async function createEvent(formData: FormData) {
  await assertAdmin();
  // Where the event leads: its own page, an external one, or no page at all
  // (event-external-link D4). Read first, because a marker's dates are
  // rewritten before anything parses them.
  const mode = readEventMode(formData);
  const title = str(formData, "title");
  const start = str(formData, "start");
  const venue = str(formData, "venue");
  // Venue and organisers are optional here (optional-venue-and-organiser): an
  // unselected value arrives as undefined and is left out of the document. The
  // public submission form still requires both. An event may name several
  // organisers, stored as `organiser` + `moreOrganisers`
  // (event-multiple-organisers D3).
  const organisers = organiserFields(organisersFrom(formData));
  if (!title || !start) {
    redirect("/beheer/nieuw/evenement?error=1");
  }
  // An external event without a usable address would link nowhere, so it is
  // refused before the upload (event-external-link D5).
  if (!mode.ok) redirect(`/beheer/nieuw/evenement?error=${mode.reason}`);
  const noPage = mode.mode === "marker";
  const end = str(formData, "end");
  // A marker shows no end, so its hidden end is kept as posted but not checked
  // against the day-start it was moved to (event-no-page D4, D5). An external
  // event shows its time like any other, so its range is checked.
  const range = noPage ? { ok: true as const } : validateEventRange(start, end);
  if (!range.ok) redirect(`/beheer/nieuw/evenement?error=${range.reason}`);
  const recurrence = adminRecurrence(formData, start);
  if (!recurrence.ok) {
    redirect(`/beheer/nieuw/evenement?error=${recurrence.reason}`);
  }
  // Further dates of an irregular series; refused alongside a recurrence
  // (event-multiple-dates D2, D7).
  const dates = datesFromForm(formData, siteInputToIso(start), Boolean(recurrence.recurrence));
  if (!dates.ok) redirect(`/beheer/nieuw/evenement?error=${dates.reason}`);
  // Validate before the upload, so a rejected form does not leave a stored file
  // behind for a document that was never created.
  const socials = socialsOrRedirect(formData, "/beheer/nieuw/evenement");
  const eventImage = await coverImage(formData, "/beheer/nieuw/evenement");
  // A marker is its image, and an external event's card is little more than its
  // image; without one there is nothing to show (event-no-page D5,
  // event-external-link D4).
  if (mode.mode !== "page" && !eventImage) {
    redirect("/beheer/nieuw/evenement?error=image-required");
  }
  await createDocument(
    "event",
    title!,
    {
      title,
      // Typed Amsterdam wall time, stored unambiguously (siteInputToIso).
      start: siteInputToIso(start),
      end: siteInputToIso(end),
      venue,
      ...organisers,
      excerpt: str(formData, "excerpt"),
      featuredImage: eventImage,
      socials,
      recurrence: recurrence.recurrence,
      dates: dates.dates,
      noPage: noPage || undefined,
      // Exactly one of the two, or neither: the radio group cannot ask for both
      // (event-external-link D1, D4).
      externalUrl: mode.externalUrl,
      status: formData.get("publish") ? "published" : "draft",
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  redirect("/beheer?created=event");
}

export async function createVenue(formData: FormData) {
  await assertAdmin();
  const name = str(formData, "name");
  if (!name) redirect("/beheer/nieuw/locatie?error=1");
  const address = str(formData, "address");
  const venueImage = await coverImage(formData, "/beheer/nieuw/locatie");
  // Prefer coordinates from an autocomplete selection; else geocode the address.
  const picked = pickedCoords(formData);
  const geo = !picked && address ? await geocode(address) : null;
  const coords = picked ?? (geo ? { lat: geo.lat, lng: geo.lng } : null);
  await createDocument(
    "venue",
    name!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      address,
      lat: coords?.lat,
      lng: coords?.lng,
      featuredImage: venueImage,
      excerpt: str(formData, "excerpt"),
      status: formData.get("publish") ? "published" : "draft",
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  const flag = picked ? undefined : geoFlag(address, geo);
  redirect(`/beheer?created=venue${flag ? `&geo=${flag}` : ""}`);
}

/** The posted image list of an organiser form, as stored fields (organiser-page-layout D2). */
function organiserImagesFrom(form: FormData) {
  return organiserImageFields(
    form.getAll("images").filter((v): v is string => typeof v === "string"),
  );
}

/**
 * Store the captions posted beside the organiser's images
 * (organiser-slide-captions D2). A caption belongs to the image, so it goes to
 * the image's details — and only when it differs from what is stored, so
 * saving an organiser does not rewrite every image's details.
 */
async function saveOrganiserCaptions(form: FormData): Promise<void> {
  const images = form.getAll("images").filter((v): v is string => typeof v === "string");
  const captions = form.getAll("captions").map((v) => (typeof v === "string" ? v.trim() : ""));
  const stored = await loadMediaDetails();
  for (const [i, url] of images.entries()) {
    const name = mediaName(url);
    const caption = captions[i] ?? "";
    if ((stored.get(name)?.caption ?? "") === caption) continue;
    await updateMediaDetails(name, { caption });
  }
}

/**
 * The organiser form's logo (organiser-page-layout D3): a pick or an upload, or
 * removed, or — when neither — left out of the patch so the stored one stays.
 */
async function organiserLogo(form: FormData, back: string): Promise<{ logo?: string }> {
  if (form.get("logoUrlRemove")) return { logo: undefined };
  const logo = await coverImage(form, back, { url: "logoUrl", file: "logo" });
  return logo ? { logo } : {};
}

export async function createOrganiser(formData: FormData) {
  await assertAdmin();
  const name = str(formData, "name");
  if (!name) redirect("/beheer/nieuw/organisator?error=1");
  const logo = await organiserLogo(formData, "/beheer/nieuw/organisator");
  await createDocument(
    "organiser",
    name!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      location: str(formData, "location"),
      ...organiserImagesFrom(formData),
      ...logo,
      excerpt: str(formData, "excerpt"),
      socials: socialsOrRedirect(formData, "/beheer/nieuw/organisator"),
      status: formData.get("publish") ? "published" : "draft",
    },
    str(formData, "body") ?? "",
  );
  await saveOrganiserCaptions(formData);
  await revalidatePublic();
  redirect("/beheer?created=organiser");
}

export async function createBlog(formData: FormData) {
  await assertAdmin();
  const title = str(formData, "title");
  const author = str(formData, "author");
  const date = str(formData, "date");
  if (!title || !author || !date) redirect("/beheer/nieuw/blog?error=1");
  const blogImage = await coverImage(formData, "/beheer/nieuw/blog");
  const relatedVenues = formData.getAll("relatedVenues").filter((v): v is string => typeof v === "string" && v !== "");
  const relatedOrganisers = formData.getAll("relatedOrganisers").filter((v): v is string => typeof v === "string" && v !== "");
  await createDocument(
    "blog",
    title!,
    {
      title,
      author,
      date,
      excerpt: str(formData, "excerpt"),
      featuredImage: blogImage,
      relatedVenues: relatedVenues.length ? relatedVenues : undefined,
      relatedOrganisers: relatedOrganisers.length ? relatedOrganisers : undefined,
      status: formData.get("publish") ? "published" : "draft",
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  redirect("/beheer?created=blog");
}

/**
 * Selected organiser slugs from a project or event form. A project requires at
 * least one (projects spec); an event may have none.
 */
function organisersFrom(form: FormData): string[] {
  return form
    .getAll("organisers")
    .filter((v): v is string => typeof v === "string" && v !== "");
}

export async function createProject(formData: FormData) {
  await assertAdmin();
  const title = str(formData, "title");
  const venue = str(formData, "venue");
  const organisers = organisersFrom(formData);
  // The location is optional; a project still names who is behind it
  // (projects spec).
  if (!title || organisers.length === 0) {
    redirect("/beheer/nieuw/project?error=1");
  }
  const projectImage = await coverImage(formData, "/beheer/nieuw/project");
  await createDocument(
    "project",
    title!,
    {
      title,
      // `date` is stamped automatically and used only for ordering (design D2);
      // it is not an editor-entered field.
      date: new Date().toISOString(),
      venue,
      organisers,
      excerpt: str(formData, "excerpt"),
      featuredImage: projectImage,
      status: formData.get("publish") ? "published" : "draft",
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  redirect("/beheer?created=project");
}

// ── Editing existing content (manage-existing-content) ───────────────────────
// Edits merge over stored frontmatter and keep the slug stable, so fields not
// on the form (uid, gallery images, submission metadata) survive and
// public URLs/index entries don't move. Status is left untouched here — it is
// managed by hide/show below.

export async function updateEvent(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("event"));
  const mode = readEventMode(formData);
  const title = str(formData, "title");
  const start = str(formData, "start");
  const venue = str(formData, "venue");
  // Both organiser fields are always in the patch, so the merge clears the ones
  // the editor removed (event-multiple-organisers D3).
  const organisers = organiserFields(organisersFrom(formData));
  const back = editBack("event", slug, formData);
  if (!title || !start) redirect(withParam(back, "error", "1"));
  if (!mode.ok) redirect(withParam(back, "error", mode.reason));
  const noPage = mode.mode === "marker";
  const end = str(formData, "end");
  // As in createEvent: a marker's hidden end is kept, not checked (event-no-page D4).
  const range = noPage ? { ok: true as const } : validateEventRange(start, end);
  if (!range.ok) redirect(withParam(back, "error", range.reason));
  // No form exposes `interval`, so carry the stored one through rather than
  // rebuilding the recurrence from the form alone — otherwise an imported
  // "every 2 weeks" silently became every week on any save, including one that
  // only changed the title (docs/bugs/recurrence-edit-clobber.md).
  const stored = await getEditable("event", slug!);
  const recurrence = recurrenceFromForm(
    formData,
    new Date(siteInputToIso(start)!),
    ADMIN_FREQUENCIES,
    stored?.data.recurrence?.interval,
  );
  if (!recurrence.ok) redirect(withParam(back, "error", recurrence.reason));
  // The edit form presents the whole list, so what it posts replaces what is
  // stored — an emptied list removes the field. Paths that do not present the
  // list (approval, import adoption, permalink change) never mention it, and
  // the merge keeps it (event-multiple-dates D7).
  const dates = datesFromForm(formData, siteInputToIso(start), Boolean(recurrence.recurrence));
  if (!dates.ok) redirect(withParam(back, "error", dates.reason));
  const socials = socialsOrRedirect(formData, back);
  const eventImage = await coverImage(formData, back);
  // As in createEvent, with the stored image counting as one already chosen.
  if (mode.mode !== "page" && !eventImage && !stored?.data.featuredImage) {
    redirect(withParam(back, "error", "image-required"));
  }
  await updateDocument(
    "event",
    slug!,
    {
      title,
      // Typed Amsterdam wall time, stored unambiguously (siteInputToIso).
      start: siteInputToIso(start),
      end: siteInputToIso(end),
      venue,
      ...organisers,
      excerpt: str(formData, "excerpt"),
      socials,
      recurrence: recurrence.recurrence,
      dates: dates.dates,
      // Both are always in the patch, so changing the mode removes the key of
      // the mode left behind (event-no-page D1, event-external-link D4). Fields
      // the other modes do not show are posted hidden and so kept, which is
      // what makes switching back restore the text, venue and organisers.
      noPage: noPage || undefined,
      externalUrl: mode.externalUrl,
      ...(eventImage ? { featuredImage: eventImage } : {}),
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  revalidatePath(adminListPath("event"));
  redirect(listBack("event", formData));
}

export async function updateVenue(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("venue"));
  const name = str(formData, "name");
  const back = editBack("venue", slug, formData);
  if (!name) redirect(withParam(back, "error", "1"));
  const address = str(formData, "address");
  const venueImage = await coverImage(formData, back);
  // Prefer an autocomplete selection; else re-geocode the address. On no
  // result, omit lat/lng so the merge keeps existing coordinates.
  const picked = pickedCoords(formData);
  const geo = !picked && address ? await geocode(address) : null;
  const coords = picked ?? (geo ? { lat: geo.lat, lng: geo.lng } : null);
  await updateDocument(
    "venue",
    slug!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      address,
      excerpt: str(formData, "excerpt"),
      ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
      ...(venueImage ? { featuredImage: venueImage } : {}),
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  revalidatePath(adminListPath("venue"));
  const flag = picked ? undefined : geoFlag(address, geo);
  const list = listBack("venue", formData);
  redirect(flag ? withParam(list, "geo", flag) : list);
}

export async function updateOrganiser(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("organiser"));
  const name = str(formData, "name");
  const back = editBack("organiser", slug, formData);
  if (!name) redirect(withParam(back, "error", "1"));
  const logo = await organiserLogo(formData, back);
  await updateDocument(
    "organiser",
    slug!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      location: str(formData, "location"),
      excerpt: str(formData, "excerpt"),
      socials: socialsOrRedirect(formData, back),
      // The form posts the whole ordered list, so it replaces what is stored —
      // removing every image clears the cover too (organiser-page-layout D2).
      ...organiserImagesFrom(formData),
      ...logo,
    },
    str(formData, "body") ?? "",
  );
  await saveOrganiserCaptions(formData);
  await revalidatePublic();
  revalidatePath(adminListPath("organiser"));
  redirect(listBack("organiser", formData));
}

export async function updateBlog(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("blog"));
  const title = str(formData, "title");
  const author = str(formData, "author");
  const date = str(formData, "date");
  const back = editBack("blog", slug, formData);
  if (!title || !author || !date) redirect(withParam(back, "error", "1"));
  const blogImage = await coverImage(formData, back);
  const relatedVenues = formData
    .getAll("relatedVenues")
    .filter((v): v is string => typeof v === "string" && v !== "");
  const relatedOrganisers = formData
    .getAll("relatedOrganisers")
    .filter((v): v is string => typeof v === "string" && v !== "");
  await updateDocument(
    "blog",
    slug!,
    {
      title,
      author,
      date,
      excerpt: str(formData, "excerpt"),
      relatedVenues: relatedVenues.length ? relatedVenues : undefined,
      relatedOrganisers: relatedOrganisers.length ? relatedOrganisers : undefined,
      ...(blogImage ? { featuredImage: blogImage } : {}),
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  revalidatePath(adminListPath("blog"));
  redirect(listBack("blog", formData));
}

export async function updateProject(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("project"));
  const title = str(formData, "title");
  const venue = str(formData, "venue");
  const organisers = organisersFrom(formData);
  const back = editBack("project", slug, formData);
  if (!title || organisers.length === 0) redirect(withParam(back, "error", "1"));
  const projectImage = await coverImage(formData, back);
  // `date` is omitted from the patch so the original ordering date is preserved.
  await updateDocument(
    "project",
    slug!,
    {
      title,
      venue,
      organisers,
      excerpt: str(formData, "excerpt"),
      ...(projectImage ? { featuredImage: projectImage } : {}),
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  revalidatePath(adminListPath("project"));
  redirect(listBack("project", formData));
}

// ── Hide / show / trash existing content ─────────────────────────────────────
// "Verbergen" is unpublish: setting status to draft hides the item from the
// public site while keeping the document in its list. "Verwijderen" moves the
// document to the trash (content-trash). Hiding a Venue/Organiser that a
// published Event/Blog still references is blocked (design D3).

// Core hide/delete logic, shared by the backend and the public-banner actions
// so the reference guard (design D3) and revalidation live in ONE place; only
// the post-action redirect differs between the two entry points. `redirect()`
// throws, so it stays in the thin action wrappers — these helpers just do the
// work and report the outcome.

/** Hide an item; returns whether it was blocked by a published reference. */
async function performHide(
  type: ManagedType,
  slug: string,
): Promise<{ blocked: boolean }> {
  if ((await findReferences(type, slug)).length) return { blocked: true };
  await setStatus(type, slug, "draft");
  await revalidateAfterItemChange(type, slug);
  revalidatePath(adminListPath(type));
  return { blocked: false };
}

/**
 * "Verwijderen": move an item to the trash (content-trash D3). For a
 * venue/organiser this is guarded by the ALL-STATUS reference scan (stricter
 * than hide): a referrer of any status — published, past, or hidden/draft —
 * blocks it. A trashed document is invisible to every reference check and may
 * later be purged, so a re-published draft would dangle; keeping the guard
 * here also means nothing in the trash is ever referenced and purging needs no
 * guard. Events, blog posts and projects have no inbound references, so they
 * go unguarded. Returns whether it was blocked.
 */
async function performDelete(
  type: ManagedType,
  slug: string,
): Promise<{ blocked: boolean }> {
  if ((await findReferences(type, slug, { includeHidden: true })).length) {
    return { blocked: true };
  }
  await trashDocument(type, slug);
  await revalidateAfterItemChange(type, slug);
  revalidatePath(adminListPath(type));
  return { blocked: false };
}

export async function hideContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  const back = listBack(type, formData);
  if ((await performHide(type, slug)).blocked) {
    redirect(withParam(back, "blocked", slug));
  }
  redirect(back);
}

export async function showContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  await setStatus(type, slug, "published");
  await revalidateAfterItemChange(type, slug);
  revalidatePath(adminListPath(type));
  redirect(listBack(type, formData));
}

// Move any content type to the trash. A venue/organiser still referenced by
// any event/blog (any status) is blocked; the admin list re-runs the all-status
// scan for ?undeletable to name the referrers (distinct from the hide ?blocked
// signal, which reports the published-only set).
export async function deleteContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  const back = listBack(type, formData);
  if ((await performDelete(type, slug)).blocked) {
    redirect(withParam(back, "undeletable", slug));
  }
  redirect(back);
}

// ── Trash (content-trash) ────────────────────────────────────────────────────
// Restore lands hidden (D4) and is refused when the slug has since been taken
// (D5); purge and empty run no guard (D3) because nothing referenced can enter
// the trash. All three land back on the trash page with a flag it turns into a
// notice.

const TRASH = "/beheer/prullenbak";

export async function restoreContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  const result = await restoreDocument(type, slug);
  if (!result.ok) {
    if (result.reason === "taken") {
      // The page names the live item that holds the slug (D5).
      redirect(
        `${TRASH}?bezet=${encodeURIComponent(`${type}:${slug}`)}&door=${encodeURIComponent(result.title)}`,
      );
    }
    redirect(TRASH);
  }
  // Hidden on return, so nothing public changes (D9) — only the type's list.
  revalidatePath(adminListPath(type));
  redirect(`${TRASH}?hersteld=${encodeURIComponent(slug)}`);
}

export async function purgeContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  await purgeDocument(type, slug);
  redirect(`${TRASH}?verwijderd=1`);
}

export async function emptyTrash() {
  await assertAdmin();
  const items = await listTrash();
  await Promise.all(items.map((i) => purgeDocument(i.type, i.slug)));
  redirect(`${TRASH}?geleegd=${items.length}`);
}

/**
 * Change the permalink of a Location, Organiser, or Project (editable-permalinks
 * D6). A separate form from the content edit, so a rename — which rewrites other
 * documents and removes a file — never rides along with an everyday save.
 * Refusals return to the edit page with `?permalink=<reason>`; a missing source
 * most likely means the same rename already completed, so it lands on the list.
 */
export async function changePermalink(formData: FormData) {
  await assertAdmin();
  const type = str(formData, "type");
  const slug = str(formData, "slug");
  if (!type || !isPermalinkType(type) || !slug) redirect("/beheer");
  const result = await changeStoredPermalink(type, slug, str(formData, "permalink") ?? "");
  if (!result.ok) {
    if (result.reason === "missing") redirect(adminListPath(type));
    redirect(`${adminEditPath(type, slug)}?permalink=${result.reason}`);
  }
  await revalidateAfterPermalinkChange(type, slug, result.slug, result.referrers);
  revalidatePath(adminListPath(type));
  if (result.referrers.some((r) => r.kind === "feed")) revalidatePath(FEEDS);
  redirect(`${adminEditPath(type, result.slug)}?permalink=ok`);
}

// ── Public-side admin banner actions (admin-presence) ────────────────────────
// The contextual banner on a public item page triggers these. Acting on an
// item makes its own public page vanish, so on success they reuse the shared
// helpers above (same rules as the backend) and land on that type's PUBLIC
// listing with a confirmation flag. A still-referenced venue/organiser is sent
// to the backend list, whose existing UI names the referencing published items.

export async function hideFromPublic(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  if ((await performHide(type, slug)).blocked) {
    redirect(`${adminListPath(type)}?blocked=${encodeURIComponent(slug)}`);
  }
  redirect(`${publicListPath(type)}?beheer=verborgen`);
}

export async function deleteFromPublic(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  // A still-referenced venue/organiser is sent to the backend list, whose UI
  // names the (all-status) referrers; otherwise land on the public listing.
  if ((await performDelete(type, slug)).blocked) {
    redirect(`${adminListPath(type)}?undeletable=${encodeURIComponent(slug)}`);
  }
  redirect(`${publicListPath(type)}?beheer=verwijderd`);
}

// ── Media library (editorial-enrichments) ────────────────────────────────────

const GALLERY = "/beheer/galerij";

/** The gallery view an action was started from, or the gallery (D1). */
function galleryBack(form: FormData): string {
  return returnPath(form.get("terug"), GALLERY);
}

/** An image's own page in the gallery. */
const imagePage = (name: string) => `${GALLERY}/${encodeURIComponent(name)}`;

export async function uploadMedia(formData: FormData) {
  await assertAdmin();
  const back = galleryBack(formData);
  const result = await saveUploadChecked(formData.get("image"));
  if (!result.ok) redirect(withParam(back, "error", result.reason));
  revalidatePath(GALLERY);
  redirect(withParam(back, "media", "geupload"));
}

/**
 * Delete one image, from its own page. Reference-safe: never delete an image
 * still used as a cover, in a gallery, or within any item's text — the image's
 * page names the items. Its details go with it.
 */
export async function deleteMediaAction(formData: FormData) {
  await assertAdmin();
  const key = str(formData, "key");
  if (!key) return;
  const item = (await listMedia()).find((m) => m.key === key);
  const back = galleryBack(formData);
  if (!item) redirect(back);
  if ((await findImageReferences(item.url)).length) {
    redirect(withParam(imagePage(mediaName(key)), "inuse", "1"));
  }
  await deleteMedia(key);
  await removeMediaDetails(mediaName(key));
  revalidatePath(GALLERY);
  redirect(withParam(back, "media", "verwijderd"));
}

/**
 * Delete the ticked images (gallery-find-and-describe D5). Each is checked on
 * its own: the unused ones go, the ones in use stay, and the gallery is told how
 * many were deleted and which were kept. The addresses come from the store, not
 * from the form.
 */
export async function deleteMediaBulk(formData: FormData) {
  await assertAdmin();
  const back = galleryBack(formData);
  const keys = new Set(formData.getAll("keys").filter((v): v is string => typeof v === "string"));
  if (keys.size === 0) redirect(withParam(back, "media", "niets-gekozen"));
  const chosen = (await listMedia()).filter((m) => keys.has(m.key));
  const usage = imageUsage(
    chosen.map((m) => m.url),
    await loadImageUsers(),
  );
  const kept: string[] = [];
  let deleted = 0;
  for (const item of chosen) {
    if (usage.get(item.url)?.length) {
      kept.push(mediaName(item.key));
      continue;
    }
    await deleteMedia(item.key);
    await removeMediaDetails(mediaName(item.key));
    deleted += 1;
  }
  revalidatePath(GALLERY);
  let to = withParam(back, "verwijderd", String(deleted));
  for (const name of kept) to = `${to}&behouden=${encodeURIComponent(name)}`;
  redirect(to);
}

/**
 * Save an image's title and alternative text (D7). A changed alternative text
 * changes the public pages that show the image, so they are revalidated like
 * after any content write (D9).
 */
export async function saveMediaDetailsAction(formData: FormData) {
  await assertAdmin();
  const key = str(formData, "key");
  if (!key) return;
  const item = (await listMedia()).find((m) => m.key === key);
  if (!item) redirect(GALLERY);
  const name = mediaName(key);
  await saveMediaDetails(name, {
    title: str(formData, "title"),
    alt: str(formData, "alt"),
    caption: str(formData, "caption"),
  });
  const users = await findImageReferences(item.url);
  await revalidateContent(users.map((u) => u.href));
  await revalidatePublic();
  revalidatePath(GALLERY);
  const terug = str(formData, "terug");
  const page = withParam(imagePage(name), "media", "opgeslagen");
  redirect(terug ? withParam(page, "terug", terug) : page);
}

/**
 * Put a new file in place of an image, keeping its address (D10). The pages
 * that use it do not change, so nothing is revalidated.
 */
export async function replaceMediaAction(formData: FormData) {
  await assertAdmin();
  const key = str(formData, "key");
  if (!key) return;
  const exists = (await listMedia()).some((m) => m.key === key);
  if (!exists) redirect(GALLERY);
  const terug = str(formData, "terug");
  const page = terug ? withParam(imagePage(mediaName(key)), "terug", terug) : imagePage(mediaName(key));
  const result = await replaceMedia(key, formData.get("image"));
  if (!result.ok) redirect(withParam(page, "error", result.reason));
  revalidatePath(GALLERY);
  redirect(withParam(page, "media", "vervangen"));
}

// ── Calendar feeds (add-managed-calendar-feeds) ──────────────────────────────

const FEEDS = "/beheer/feeds";

function feedFields(form: FormData) {
  return {
    label: str(form, "label"),
    url: str(form, "url"),
    defaultVenue: str(form, "defaultVenue"),
    defaultOrganiser: str(form, "defaultOrganiser"),
  };
}

export async function createFeedAction(formData: FormData) {
  await assertAdmin();
  const f = feedFields(formData);
  if (!f.label || !f.url || !f.defaultVenue || !f.defaultOrganiser) {
    redirect("/beheer/import?error=1");
  }
  const id = await createFeed({
    label: f.label!,
    url: f.url!,
    defaultVenue: f.defaultVenue!,
    defaultOrganiser: f.defaultOrganiser!,
  });
  revalidatePath(FEEDS);
  revalidatePath("/beheer");
  redirect(`${FEEDS}?created=${id}`);
}

export async function updateFeedAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect(FEEDS);
  const f = feedFields(formData);
  if (!f.label || !f.url || !f.defaultVenue || !f.defaultOrganiser) {
    redirect(`${FEEDS}/${id}/bewerken?error=1`);
  }
  await updateFeed(id!, {
    label: f.label,
    url: f.url,
    defaultVenue: f.defaultVenue,
    defaultOrganiser: f.defaultOrganiser,
  });
  revalidatePath(FEEDS);
  revalidatePath("/beheer");
  redirect(FEEDS);
}

/**
 * Remove a feed. Its events are deliberately left alone (design D9) — once
 * imported, the site owns them; deleting a feed is tidying a list, not a
 * destructive content operation.
 */
export async function deleteFeedAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect(FEEDS);
  await deleteFeed(id!);
  revalidatePath(FEEDS);
  revalidatePath("/beheer");
  redirect(`${FEEDS}?deleted=1`);
}

/** Pause/resume. A paused feed keeps everything but is skipped by "Sync alle". */
export async function toggleFeedPausedAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect(FEEDS);
  const feed = await getFeed(id!);
  if (!feed) redirect(FEEDS);
  await updateFeed(id!, { paused: !feed!.paused });
  revalidatePath(FEEDS);
  revalidatePath("/beheer");
  redirect(FEEDS);
}

/** Run one feed and record the outcome on it (design D7). */
async function runFeed(id: string): Promise<{ label: string; result: SyncResult } | null> {
  const feed = await getFeed(id);
  if (!feed) return null;
  const result = await syncFeed(feed);
  const failed = result.errors.length > 0 && result.created === 0 && result.skipped === 0;
  await updateFeed(id, {
    lastSyncedAt: new Date().toISOString(),
    lastCreated: result.created,
    lastSkipped: result.skipped,
    lastSkippedPast: result.skippedPast,
    lastHidden: result.hidden,
    lastFlagged: result.flagged,
    // Cleared on success, so a fixed feed stops warning on the dashboard.
    lastError: failed ? result.errors[0] : undefined,
  });
  return { label: feed.label, result };
}

export async function syncFeedAction(formData: FormData) {
  await assertAdmin();
  const id = str(formData, "id");
  if (!id) redirect(FEEDS);
  await runFeed(id!);
  await revalidatePublic();
  revalidatePath(FEEDS);
  revalidatePath("/beheer/queue");
  revalidatePath("/beheer");
  redirect(`${FEEDS}?synced=${id}`);
}

/**
 * Sync every non-paused feed. Each feed is run independently so one failure
 * cannot stop the rest (design D10), and each records its own outcome — an
 * aggregate would hide *which* feed failed, undoing the only mechanism that
 * surfaces a broken feed at all.
 */
export async function syncAllFeedsAction() {
  await assertAdmin();
  const feeds = await listFeeds();
  for (const feed of feeds.filter((f) => !f.paused)) {
    try {
      await runFeed(feed.id);
    } catch (err) {
      await updateFeed(feed.id, {
        lastSyncedAt: new Date().toISOString(),
        lastError: (err as Error).message,
      });
    }
  }
  await revalidatePublic();
  revalidatePath(FEEDS);
  revalidatePath("/beheer/queue");
  revalidatePath("/beheer");
  redirect(`${FEEDS}?synced=alle`);
}
