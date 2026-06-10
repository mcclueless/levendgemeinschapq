"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  SESSION_COOKIE,
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
import { findReferences } from "@/content/admin";
import { saveUpload } from "@/content/media";
import { importFromUrl } from "@/content/ical-import";
import { revalidatePublic } from "@/content/revalidate";
import { adminListPath } from "@/lib/routes";

type ManagedType = "event" | "venue" | "organiser" | "blog";

function managedType(form: FormData): ManagedType | undefined {
  const t = str(form, "type");
  return t === "event" || t === "venue" || t === "organiser" || t === "blog"
    ? t
    : undefined;
}

function str(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const password = str(formData, "password") ?? "";
  const next = str(formData, "next") ?? "/beheer";
  if (!checkAdminPassword(password)) {
    redirect(`/beheer/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const token = await createSessionToken();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(next);
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
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
  const eventImage = await saveUpload(formData.get("image"));
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
  const lat = str(formData, "lat");
  const lng = str(formData, "lng");
  const venueImage = await saveUpload(formData.get("image"));
  await createDocument(
    "venue",
    name!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      address: str(formData, "address"),
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      featuredImage: venueImage,
      excerpt: str(formData, "excerpt"),
      status: formData.get("publish") ? "published" : "draft",
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  redirect("/beheer?created=venue");
}

export async function createOrganiser(formData: FormData) {
  await assertAdmin();
  const name = str(formData, "name");
  if (!name) redirect("/beheer/nieuw/organisator?error=1");
  const organiserImage = await saveUpload(formData.get("image"));
  await createDocument(
    "organiser",
    name!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      featuredImage: organiserImage,
      excerpt: str(formData, "excerpt"),
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
  const blogImage = await saveUpload(formData.get("image"));
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
  const eventImage = await saveUpload(formData.get("image"));
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
  const lat = str(formData, "lat");
  const lng = str(formData, "lng");
  const venueImage = await saveUpload(formData.get("image"));
  await updateDocument(
    "venue",
    slug!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      address: str(formData, "address"),
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      excerpt: str(formData, "excerpt"),
      ...(venueImage ? { featuredImage: venueImage } : {}),
    },
    str(formData, "body") ?? "",
  );
  await revalidatePublic();
  revalidatePath(adminListPath("venue"));
  redirect(adminListPath("venue"));
}

export async function updateOrganiser(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) redirect(adminListPath("organiser"));
  const name = str(formData, "name");
  if (!name) redirect(`${adminListPath("organiser")}/${slug}/bewerken?error=1`);
  const organiserImage = await saveUpload(formData.get("image"));
  await updateDocument(
    "organiser",
    slug!,
    {
      name,
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      website: str(formData, "website"),
      excerpt: str(formData, "excerpt"),
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
  const blogImage = await saveUpload(formData.get("image"));
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

// ── Hide / show existing content ─────────────────────────────────────────────
// "Delete" is unpublish: setting status to draft hides the item from the public
// site while keeping the document. Hiding a Venue/Organiser that a published
// Event/Blog still references is blocked (design D3).

export async function hideContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  const refs = await findReferences(type, slug);
  if (refs.length) {
    redirect(`${adminListPath(type)}?blocked=${encodeURIComponent(slug)}`);
  }
  await setStatus(type, slug, "draft");
  await revalidatePublic();
  revalidatePath(adminListPath(type));
  redirect(adminListPath(type));
}

export async function showContent(formData: FormData) {
  await assertAdmin();
  const type = managedType(formData);
  const slug = str(formData, "slug");
  if (!type || !slug) return;
  await setStatus(type, slug, "published");
  await revalidatePublic();
  revalidatePath(adminListPath(type));
  redirect(adminListPath(type));
}

// Permanent, irreversible removal — Events only (design D6). Nothing references
// events, so there is no reference guard here (unlike hiding a venue/organiser).
export async function deleteEvent(formData: FormData) {
  await assertAdmin();
  const slug = str(formData, "slug");
  if (!slug) return;
  await deleteDocument("event", slug);
  await revalidatePublic();
  revalidatePath(adminListPath("event"));
  redirect(adminListPath("event"));
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
