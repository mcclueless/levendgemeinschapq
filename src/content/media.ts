import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { slugify } from "./write";

/**
 * Media uploads + library (editorial-backend spec). Stores images and lists the
 * pool of previously uploaded images. Mirrors the content storage strategy: an
 * S3 media bucket in deployment, local `public/uploads` for credential-free
 * local runs.
 */

/**
 * Extensions the library will *list*. Deliberately wider than what may be
 * uploaded: SVGs already in the bank stay usable, but no new one is accepted.
 * See UPLOAD_EXT.
 */
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

/**
 * Extensions that may be *uploaded*. Narrower than IMAGE_EXT by one entry:
 * SVG is a scriptable document, and `public/uploads/*` is served from the
 * site's own origin, so accepting one is a stored-XSS vector. Administrators
 * are not a mitigation once anonymous upload exists.
 *
 * Keep this in sync with MAGIC below and with IMAGE_EXT's intentional gap.
 */
const UPLOAD_EXT = /\.(png|jpe?g|gif|webp|avif)$/i;

/** Maximum accepted upload, both paths (add-public-media-and-socials D7). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Leading-byte signatures, so a `.jpg` that is not a JPEG is refused. The
 * declared Content-Type and the extension are both attacker-controlled; the
 * bytes are the only part that is not.
 */
const MAGIC: { ext: RegExp; type: string; test: (b: Buffer) => boolean }[] = [
  {
    ext: /\.png$/i,
    type: "image/png",
    test: (b) =>
      b.length > 8 &&
      b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    ext: /\.jpe?g$/i,
    type: "image/jpeg",
    test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    ext: /\.gif$/i,
    type: "image/gif",
    test: (b) => b.length > 6 && b.subarray(0, 6).toString("ascii").startsWith("GIF8"),
  },
  {
    ext: /\.webp$/i,
    type: "image/webp",
    test: (b) =>
      b.length > 12 &&
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
  {
    ext: /\.avif$/i,
    type: "image/avif",
    test: (b) => b.length > 12 && b.subarray(4, 8).toString("ascii") === "ftyp",
  },
];

/** Why an upload was refused, so the caller can say which rule it broke. */
export type UploadError = "upload-type" | "upload-size" | "upload-corrupt";

export type UploadResult =
  | { ok: true; url: string | undefined }
  | { ok: false; reason: UploadError };

/** An image in the media pool, for the cover-image picker. */
export interface MediaItem {
  /** Public URL to render/use as a cover. */
  url: string;
  /** Storage key, e.g. "uploads/foo-1234.jpg". Stable id for the grid. */
  key: string;
  /** Bytes. */
  size: number;
  /** ISO timestamp; newest first in listings. */
  lastModified: string;
}

/** Public URL for a media key ("uploads/<name>"), matching the store backend. */
function mediaUrl(key: string): string {
  const bucket = process.env.S3_MEDIA_BUCKET;
  if (!bucket) return `/${key}`; // local: served from public/<key>
  const region = process.env.AWS_REGION ?? "eu-central-1";
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/+$/, "");
  // Prefer an explicit base URL (CDN/custom domain); otherwise the bucket's
  // virtual-hosted URL — an absolute URL that resolves (the object is in S3,
  // not the app's public dir).
  return baseUrl
    ? `${baseUrl}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Store an uploaded image, validating it first.
 *
 * Until this was reachable only from behind `assertAdmin()`, none of these
 * checks existed — any file of any size and any type was accepted, and the
 * stored filename was a pure function of the uploader's own input. Public
 * submission changes the threat model, so validation is the precondition for
 * that feature rather than an addition to it.
 *
 * Returns `{ ok: true, url: undefined }` when no file was supplied: an absent
 * upload is not an error, it just means "no cover".
 */
export async function saveUploadChecked(file: unknown): Promise<UploadResult> {
  if (!(file instanceof File) || file.size === 0) return { ok: true, url: undefined };

  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, reason: "upload-size" };

  const rawExt = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  if (!UPLOAD_EXT.test(rawExt)) return { ok: false, reason: "upload-type" };

  // The declared type must at least agree with the extension. Both are
  // attacker-supplied, so this only catches carelessness — the magic-byte
  // check below is what actually establishes the format.
  const signature = MAGIC.find((m) => m.ext.test(rawExt));
  if (!signature) return { ok: false, reason: "upload-type" };
  if (file.type && file.type !== signature.type && !file.type.startsWith("image/")) {
    return { ok: false, reason: "upload-type" };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > MAX_UPLOAD_BYTES) return { ok: false, reason: "upload-size" };
  if (!signature.test(bytes)) return { ok: false, reason: "upload-corrupt" };

  const ext = rawExt;
  const base = slugify(path.basename(file.name, path.extname(file.name)));
  // Non-guessable suffix. The previous `${base}-${file.size}${ext}` was a pure
  // function of attacker-controlled inputs and `write` overwrites
  // unconditionally, so a crafted name+size could replace someone else's
  // stored image.
  const name = `${base || "afbeelding"}-${randomUUID().slice(0, 12)}${ext}`;
  const key = `uploads/${name}`;

  const bucket = process.env.S3_MEDIA_BUCKET;
  if (bucket) {
    const region = process.env.AWS_REGION ?? "eu-central-1";
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({ region });
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        // The verified format, never the client's claim.
        ContentType: signature.type,
      }),
    );
    return { ok: true, url: mediaUrl(key) };
  }

  // Local fallback: write into public/uploads and serve from /uploads.
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return { ok: true, url: mediaUrl(key) };
}

/**
 * Delete an image from the media store by its storage key ("uploads/<name>").
 * Symmetric with saveUpload: S3 DeleteObject in deployment, unlink under
 * public/uploads locally. Idempotent — removing a missing local file is a no-op.
 */
export async function deleteMedia(key: string): Promise<void> {
  const bucket = process.env.S3_MEDIA_BUCKET;
  if (bucket) {
    const region = process.env.AWS_REGION ?? "eu-central-1";
    const { S3Client, DeleteObjectCommand } = await import(
      "@aws-sdk/client-s3"
    );
    const client = new S3Client({ region });
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return;
  }

  const name = key.replace(/^uploads\//, "");
  const file = path.join(process.cwd(), "public", "uploads", name);
  await fs.rm(file, { force: true });
}

/**
 * The pool of previously uploaded images (the "image bank"), newest first.
 * Lists the S3 media bucket's `uploads/` prefix, or `public/uploads` locally.
 */
export async function listMedia(): Promise<MediaItem[]> {
  const bucket = process.env.S3_MEDIA_BUCKET;

  if (bucket) {
    const { S3Client, ListObjectsV2Command } = await import(
      "@aws-sdk/client-s3"
    );
    const client = new S3Client({
      region: process.env.AWS_REGION ?? "eu-central-1",
    });
    const items: MediaItem[] = [];
    let token: string | undefined;
    do {
      const out = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: "uploads/",
          ContinuationToken: token,
        }),
      );
      for (const obj of out.Contents ?? []) {
        if (!obj.Key || !IMAGE_EXT.test(obj.Key)) continue;
        items.push({
          url: mediaUrl(obj.Key),
          key: obj.Key,
          size: obj.Size ?? 0,
          lastModified: (obj.LastModified ?? new Date(0)).toISOString(),
        });
      }
      token = out.IsTruncated ? out.NextContinuationToken : undefined;
    } while (token);
    return sortNewestFirst(items);
  }

  // Local fallback.
  const dir = path.join(process.cwd(), "public", "uploads");
  let names: string[];
  try {
    names = await fs.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const items = await Promise.all(
    names
      .filter((n) => IMAGE_EXT.test(n))
      .map(async (n) => {
        const stat = await fs.stat(path.join(dir, n));
        const key = `uploads/${n}`;
        return {
          url: mediaUrl(key),
          key,
          size: stat.size,
          lastModified: stat.mtime.toISOString(),
        };
      }),
  );
  return sortNewestFirst(items);
}

function sortNewestFirst(items: MediaItem[]): MediaItem[] {
  return items.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
}
