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
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: process.env.AWS_REGION ?? "eu-central-1",
    });
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: bytes,
        ContentType: file.type || "application/octet-stream",
      }),
    );
    const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL ?? "";
    return `${baseUrl}/${key}`;
  }

  // Local fallback: write into public/uploads and serve from /uploads.
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}
