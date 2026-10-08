import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { slugify } from "./write";
import { loadMediaDetails, mediaName } from "./media-details";
import { MAX_UPLOAD_BYTES, UPLOAD_EXT } from "./upload-rules";

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

// Upload extensions and size live in `upload-rules.ts`, shared with the
// guidance shown beside image fields. Keep UPLOAD_EXT in sync with MAGIC below
// and with IMAGE_EXT's intentional gap (no SVG uploads).
export { MAX_UPLOAD_BYTES } from "./upload-rules";

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

/**
 * How stored images are cached (gallery-find-and-describe D10). Images are
 * served straight from the bucket, with no CDN in front; without a lifetime a
 * browser keeps a copy for about a tenth of the image's age, so a replaced file
 * could stay stale for days. `no-cache` makes the browser ask each time — a
 * `304` when nothing changed — so a replacement shows at once.
 */
const CACHE_CONTROL = "no-cache";

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
  /** A name the editor gave it, shown in place of the file name. */
  title?: string;
  /** The editor's description of it, for people who cannot see it. */
  alt?: string;
  /** Text shown beneath it in a slideshow. */
  caption?: string;
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

/** A file that passed every upload check, with what storing it needs. */
type CheckedUpload =
  | { ok: true; file: File; bytes: Buffer; ext: string; type: string }
  | { ok: true; file: undefined }
  | { ok: false; reason: UploadError };

/**
 * The checks every stored file passes: size, an allowed extension, a declared
 * type that agrees with it, and leading bytes that really are that format.
 * `{ ok: true, file: undefined }` means no file was supplied.
 */
async function checkUpload(file: unknown): Promise<CheckedUpload> {
  if (!(file instanceof File) || file.size === 0) return { ok: true, file: undefined };

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

  return { ok: true, file, bytes, ext: rawExt, type: signature.type };
}

/** Write verified image bytes under `key`, in the bucket or the local folder. */
async function storeImage(key: string, bytes: Buffer, type: string): Promise<void> {
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
        ContentType: type,
        CacheControl: CACHE_CONTROL,
      }),
    );
    return;
  }

  // Local fallback: write into public/uploads and serve from /uploads.
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, mediaName(key)), bytes);
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
  const checked = await checkUpload(file);
  if (!checked.ok) return checked;
  if (!checked.file) return { ok: true, url: undefined };
  const { file: upload, bytes, ext, type } = checked;

  const base = slugify(path.basename(upload.name, path.extname(upload.name)));
  // Non-guessable suffix. The previous `${base}-${file.size}${ext}` was a pure
  // function of attacker-controlled inputs and `write` overwrites
  // unconditionally, so a crafted name+size could replace someone else's
  // stored image.
  const name = `${base || "afbeelding"}-${randomUUID().slice(0, 12)}${ext}`;
  const key = `uploads/${name}`;

  await storeImage(key, bytes, type);
  return { ok: true, url: mediaUrl(key) };
}

/** Why a replacement was refused: an upload rule, no file, or another format. */
export type ReplaceError = UploadError | "replace-missing" | "replace-format";

export type ReplaceCheck =
  | { ok: true; bytes: Buffer; type: string }
  | { ok: false; reason: ReplaceError };

/**
 * Whether `file` may take the place of the image stored under `key`
 * (gallery-find-and-describe D10): it passes every upload check and is the same
 * format, so the stored name's extension and the content type stay true.
 * Compared by verified format, so a `.jpeg` may replace a `.jpg`.
 */
export async function checkReplacement(key: string, file: unknown): Promise<ReplaceCheck> {
  const checked = await checkUpload(file);
  if (!checked.ok) return checked;
  if (!checked.file) return { ok: false, reason: "replace-missing" };
  const stored = MAGIC.find((m) => m.ext.test(path.extname(key)));
  if (!stored || stored.type !== checked.type) return { ok: false, reason: "replace-format" };
  return { ok: true, bytes: checked.bytes, type: checked.type };
}

/**
 * Put a new file in place of a stored image, keeping its name and so its
 * address: everything that uses the image shows the new file.
 */
export async function replaceMedia(
  key: string,
  file: unknown,
): Promise<{ ok: true } | { ok: false; reason: ReplaceError }> {
  const checked = await checkReplacement(key, file);
  if (!checked.ok) return checked;
  await storeImage(key, checked.bytes, checked.type);
  return { ok: true };
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
  const [items, details] = await Promise.all([listStoredMedia(), loadMediaDetails()]);
  return items.map((item) => ({ ...item, ...details.get(mediaName(item.key)) }));
}

/** The stored files themselves, newest first, without their details. */
async function listStoredMedia(): Promise<MediaItem[]> {
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
