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
  deleteDocument,
  setStatus,
  updateDocument,
} from "@/content/write";
import { findImageReferences, findReferences } from "@/content/admin";
import { deleteMedia, saveUpload } from "@/content/media";
import { SOCIAL_PLATFORMS } from "@/content/schema";
import { geocode, type GeocodeResult } from "@/content/geocode";
import { importFromUrl } from "@/content/ical-import";
import { revalidatePublic, revalidateAfterItemChange } from "@/content/revalidate";
import { adminListPath, publicListPath } from "@/lib/routes";

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
async function coverImage(form: FormData): Promise<string | undefined> {
  return str(form, "featuredImageUrl") ?? (await saveUpload(form.get("image")));
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

/** Curated social links from a content form (editorial-enrichments). Returns
 *  only the platforms that were filled in, or undefined when none were. */
function socialsFrom(form: FormData) {
  const entries = SOCIAL_PLATFORMS.map(
    (p) => [p, str(form, p)] as const,
  ).filter((e): e is readonly [(typeof SOCIAL_PLATFORMS)[number], string] =>
    Boolean(e[1]),
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
}

// ── Content creation (admin) ─────────────────────────────────────────────────
function recurrenceFrom(form: FormData) {
  const freq = str(form, "recurrence");
  if (freq === "weekly" || freq === "monthly") return { freq, interval: 1 };
  return undefined;
}

export async function createEvent(formData: FormData) {
  await assertAdmin();
  const title = str(formData, "title");
  const start = str(formData, "start");
  const venue = str(formData, "venue");
  const organiser = str(formData, "organiser");
  if (!title || !start || !venue || !organiser) {
    redirect("/beheer/nieuw/evenement?error=1");
  }
  const eventImage = await coverImage(formData);
  await createDocument(
    "event",
    title!,
    {
      title,
      start,
      end: str(formData, "end"),
      venue,
      organiser,
      excerpt: str(formData, "excerpt"),
      featuredImage: eventImage,
      socials: socialsFrom(formData),
      recurrence: recurrenceFrom(formData),
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
  const venueImage = await coverImage(formData);
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

export async function createOrganiser(formData: FormData) {
  await assertAdmin();
  const name = str(formData, "name");
  if (!name) redirect("/beheer/nieuw/organisator?error=1");
  const organiserImage = await coverImage(formData);
  await createDocument(
    "organiser",
    name!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      location: str(formData, "location"),
      featuredImage: organiserImage,
      excerpt: str(formData, "excerpt"),
      socials: socialsFrom(formData),
      status: formData.get("publish") ? "published" : "draft",
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  redirect("/beheer?created=organiser");
}

export async function createBlog(formData: FormData) {
  await assertAdmin();
  const title = str(formData, "title");
  const author = str(formData, "author");
  const date = str(formData, "date");
  if (!title || !author || !date) redirect("/beheer/nieuw/blog?error=1");
  const blogImage = await coverImage(formData);
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

/** Selected organiser slugs from a project form (projects spec: ≥1 required). */
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
  // One location and at least one organiser are required (projects spec).
  if (!title || !venue || organisers.length === 0) {
    redirect("/beheer/nieuw/project?error=1");
  }
  const projectImage = await coverImage(formData);
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
  const title = str(formData, "title");
  const start = str(formData, "start");
  const venue = str(formData, "venue");
  const organiser = str(formData, "organiser");
  if (!title || !start || !venue || !organiser) {
    redirect(`${adminListPath("event")}/${slug}/bewerken?error=1`);
  }
  const eventImage = await coverImage(formData);
  await updateDocument(
    "event",
    slug!,
    {
      title,
      start,
      end: str(formData, "end"),
      venue,
      organiser,
      excerpt: str(formData, "excerpt"),
      socials: socialsFrom(formData),
      recurrence: recurrenceFrom(formData),
      ...(eventImage ? { featuredImage: eventImage } : {}),
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  revalidatePath(adminListPath("event"));
  redirect(adminListPath("event"));
}

export async function updateVenue(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("venue"));
  const name = str(formData, "name");
  if (!name) redirect(`${adminListPath("venue")}/${slug}/bewerken?error=1`);
  const address = str(formData, "address");
  const venueImage = await coverImage(formData);
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
  redirect(`${adminListPath("venue")}${flag ? `?geo=${flag}` : ""}`);
}

export async function updateOrganiser(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("organiser"));
  const name = str(formData, "name");
  if (!name) redirect(`${adminListPath("organiser")}/${slug}/bewerken?error=1`);
  const organiserImage = await coverImage(formData);
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
      socials: socialsFrom(formData),
      ...(organiserImage ? { featuredImage: organiserImage } : {}),
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  revalidatePath(adminListPath("organiser"));
  redirect(adminListPath("organiser"));
}

export async function updateBlog(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("blog"));
  const title = str(formData, "title");
  const author = str(formData, "author");
  const date = str(formData, "date");
  if (!title || !author || !date) {
    redirect(`${adminListPath("blog")}/${slug}/bewerken?error=1`);
  }
  const blogImage = await coverImage(formData);
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
  redirect(adminListPath("blog"));
}

export async function updateProject(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("project"));
  const title = str(formData, "title");
  const venue = str(formData, "venue");
  const organisers = organisersFrom(formData);
  if (!title || !venue || organisers.length === 0) {
    redirect(`${adminListPath("project")}/${slug}/bewerken?error=1`);
  }
  const projectImage = await coverImage(formData);
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
  redirect(adminListPath("project"));
}

// ── Hide / show existing content ─────────────────────────────────────────────
// "Delete" is unpublish: setting status to draft hides the item from the public
// site while keeping the document. Hiding a Venue/Organiser that a published
// Event/Blog still references is blocked (design D3).

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
 * Permanently delete an item. For a venue/organiser this is guarded by the
 * ALL-STATUS reference scan (stricter than hide): a referrer of any status —
 * published, past, or hidden/draft — blocks it, since a permanent delete is
 * irreversible and a re-published draft would dangle. Events and blog posts
 * have no inbound references, so they delete unguarded. Returns whether it was
 * blocked.
 */
async function performDelete(
  type: ManagedType,
  slug: string,
): Promise<{ blocked: boolean }> {
  if ((await findReferences(type, slug, { includeHidden: true })).length) {
    return { blocked: true };
  }
  await deleteDocument(type, slug);
  await revalidateAfterItemChange(type, slug);
  revalidatePath(adminListPath(type));
  return { blocked: false };
}

export async function hideContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  if ((await performHide(type, slug)).blocked) {
    redirect(`${adminListPath(type)}?blocked=${encodeURIComponent(slug)}`);
  }
  redirect(adminListPath(type));
}

export async function showContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  await setStatus(type, slug, "published");
  await revalidateAfterItemChange(type, slug);
  revalidatePath(adminListPath(type));
  redirect(adminListPath(type));
}

// Permanent, irreversible removal for any content type. A venue/organiser still
// referenced by any event/blog (any status) is blocked; the admin list re-runs
// the all-status scan for ?undeletable to name the referrers (distinct from the
// hide ?blocked signal, which reports the published-only set).
export async function deleteContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  if ((await performDelete(type, slug)).blocked) {
    redirect(`${adminListPath(type)}?undeletable=${encodeURIComponent(slug)}`);
  }
  redirect(adminListPath(type));
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

export async function uploadMedia(formData: FormData) {
  await assertAdmin();
  await saveUpload(formData.get("image"));
  revalidatePath("/beheer/galerij");
  redirect("/beheer/galerij?media=geupload");
}

export async function deleteMediaAction(formData: FormData) {
  await assertAdmin();
  const key = str(formData, "key");
  const url = str(formData, "url");
  if (!key || !url) return;
  // Reference-safe: never delete an image still used as a cover or in a venue
  // gallery. The page re-runs the scan for ?inuse to name the using items.
  if ((await findImageReferences(url)).length) {
    redirect(`/beheer/galerij?inuse=${encodeURIComponent(key)}`);
  }
  await deleteMedia(key);
  revalidatePath("/beheer/galerij");
  redirect("/beheer/galerij?media=verwijderd");
}

// ── Calendar import ──────────────────────────────────────────────────────────
export async function importCalendar(formData: FormData) {
  await assertAdmin();
  const url = str(formData, "url");
  const defaultVenue = str(formData, "defaultVenue");
  const defaultOrganiser = str(formData, "defaultOrganiser");
  if (!url || !defaultVenue || !defaultOrganiser) {
    redirect("/beheer/import?error=1");
  }
  const result = await importFromUrl(url!, {
    defaultVenue: defaultVenue!,
    defaultOrganiser: defaultOrganiser!,
  });
  revalidatePath("/beheer/queue");
  revalidatePath("/beheer");
  const params = new URLSearchParams({
    created: String(result.created),
    skipped: String(result.skipped),
    flagged: String(result.flagged),
  });
  if (result.errors.length) params.set("error", result.errors[0]);
  redirect(`/beheer/import?${params.toString()}`);
}
