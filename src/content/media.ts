import { promises as fs } from "node:fs";
import path from "node:path";
import { slugify } from "./write";

/**
 * Media uploads (editorial-backend spec 8.3). Stores images and returns a
 * public URL. Mirrors the content storage strategy: S3 media bucket in
 * deployment, local `public/uploads` for credential-free local runs.
 */
export async function saveUpload(file: unknown): Promise<string | undefined> {
  if (!(file instanceof File) || file.size === 0) return undefined;

  const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = slugify(path.basename(file.name, path.extname(file.name)));
  // Deterministic-enough unique name without Date.now in hot paths.
  const name = `${base || "afbeelding"}-${file.size}${ext || ".bin"}`;
  const bytes = Buffer.from(await file.arrayBuffer());

  const bucket = process.env.S3_MEDIA_BUCKET;
  if (bucket) {
    const key = `uploads/${name}`;
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
    // Prefer an explicit media base URL (CDN/custom domain). Without one, fall
    // back to the bucket's virtual-hosted S3 URL — an absolute URL that
    // actually resolves — rather than a site-relative "/uploads/…" path that
    // 404s because the object lives in S3, not in the app's public dir.
    const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.replace(/\/+$/, "");
    return baseUrl
      ? `${baseUrl}/${key}`
      : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  // Local fallback: write into public/uploads and serve from /uploads.
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}
