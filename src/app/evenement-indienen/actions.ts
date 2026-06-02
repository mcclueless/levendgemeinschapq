"use server";

import { redirect } from "next/navigation";
import { createDocument } from "@/content/write";

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
      status: "pending",
      submittedBy: submitter,
      submittedAt: new Date().toISOString(),
    },
    str(formData, "body") ?? "",
  );

  redirect("/evenement-indienen?ingediend=1");
}
