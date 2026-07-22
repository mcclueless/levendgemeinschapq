"use server";

import { redirect } from "next/navigation";
import { createDocument } from "@/content/write";
import {
  PUBLIC_FREQUENCIES,
  recurrenceFromForm,
} from "@/content/recurrence-form";
import { validateEventRange } from "@/content/event-form";
import { socialsFromForm } from "@/content/socials-form";
import { saveUploadChecked } from "@/content/media";

function str(form: FormData, key: string): string | undefined {
  const v = form.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : undefined;
}

/**
 * Public event submission (editorial-backend spec 8.4): anyone may submit; the
 * event is written as `pending` and enters the admin approval queue. It is not
 * published until an administrator approves it.
 */
export async function submitEvent(formData: FormData) {
  const title = str(formData, "title");
  const start = str(formData, "start");
  const venue = str(formData, "venue");
  const organiser = str(formData, "organiser");
  const submitter = str(formData, "submitter");

  if (!title || !start || !venue || !organiser) {
    redirect("/evenement-indienen?error=1");
  }

  const end = str(formData, "end");
  const range = validateEventRange(start, end);
  if (!range.ok) redirect(`/evenement-indienen?error=${range.reason}`);

  // Weekly only. A hand-crafted POST carrying `monthly` is treated as
  // non-repeating rather than persisted — the omitted <option> is a
  // convenience, this is the contract (add-recurrence-end-date D7).
  const recurrence = recurrenceFromForm(
    formData,
    new Date(start!),
    PUBLIC_FREQUENCIES,
  );
  if (!recurrence.ok) {
    redirect(`/evenement-indienen?error=${recurrence.reason}`);
  }

  const socials = socialsFromForm(formData);
  if (!socials.ok) {
    redirect(`/evenement-indienen?error=socials-${socials.platform}`);
  }

  // Cover comes from an uploaded file ONLY. `featuredImageUrl` is deliberately
  // never read here: honouring it would let a hand-crafted POST set the cover
  // to an existing library image or any URL on the internet (design D2).
  const upload = await saveUploadChecked(formData.get("image"));
  if (!upload.ok) redirect(`/evenement-indienen?error=${upload.reason}`);

  await createDocument(
    "event",
    title!,
    {
      title,
      start,
      end,
      venue,
      organiser,
      excerpt: str(formData, "excerpt"),
      featuredImage: upload.url,
      socials: socials.socials,
      recurrence: recurrence.recurrence,
      status: "pending",
      submittedBy: submitter,
      submittedAt: new Date().toISOString(),
    },
    str(formData, "body") ?? "",
  );

  redirect("/evenement-indienen?ingediend=1");
}
