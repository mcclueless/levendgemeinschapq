import { promises as fs } from "node:fs";
import path from "node:path";
import { slugify } from "./write";

/**
 * Media uploads + library (editorial-backend spec). Stores images and lists the
 * pool of previously uploaded images. Mirrors the content storage strategy: an
 * S3 media bucket in deployment, local `public/uploads` for credential-free
 * local runs.
 */

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg)$/i;

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

export async function saveUpload(file: unknown): Promise<string | undefined> {
  if (!(file instanceof File) || file.size === 0) return undefined;

  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = slugify(path.basename(file.name, path.extname(file.name)));
  // Deterministic-enough unique name without Date.now in hot paths.
  const name = `${base || "afbeelding"}-${file.size}${ext || ".bin"}`;
  const key = `uploads/${name}`;
  const bytes = Buffer.from(await file.arrayBuffer());

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
        ContentType: file.type || "application/octet-stream",
      }),
    );
    return mediaUrl(key);
  }

  // Local fallback: write into public/uploads and serve from /uploads.
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return mediaUrl(key);
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
