"use server";

import type { ReactNode } from "react";
import { isAdmin } from "@/lib/auth-server";
import { compileBody } from "@/components/mdx/mdx";
import { saveUploadChecked } from "@/content/media";

/**
 * Server actions behind the body editor on the backend content forms
 * (body-editor-toolbar D4, D5). Both return data rather than redirecting, so
 * the editor stays on the form with its unsaved text.
 */

export type PreviewResult = { ok: true; node: ReactNode } | { ok: false; error: string };

/**
 * Render a body exactly as its public page will, for an administrator only.
 * A body the compiler rejects comes back as `{ ok: false }` with the compiler's
 * message, never as a partial rendering.
 */
export async function previewBody(source: string): Promise<PreviewResult> {
  if (!(await isAdmin())) return { ok: false, error: "Niet ingelogd." };
  try {
    return { ok: true, node: await compileBody(source) };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export type InlineUploadResult = { ok: true; url: string } | { ok: false; reason: string };

/**
 * Store an image picked in the body editor's image dialog and return its URL.
 * Validation, naming and storage are those of every other upload, so the image
 * lands in the media library like any other.
 */
export async function uploadInlineImage(formData: FormData): Promise<InlineUploadResult> {
  if (!(await isAdmin())) return { ok: false, reason: "auth" };
  const result = await saveUploadChecked(formData.get("image"));
  if (!result.ok) return { ok: false, reason: result.reason };
  if (!result.url) return { ok: false, reason: "upload-missing" };
  return { ok: true, url: result.url };
}
