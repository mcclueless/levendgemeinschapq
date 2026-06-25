import { promises as fs } from "node:fs";
import path from "node:path";
// Note: node:fs makes this module inherently server-only; it is also reused by
// the `reindex` CLI, so we avoid the `server-only` import guard here.

/**
 * Content storage abstraction (design D2/D3).
 *
 * The source of truth is MD/MDX documents under per-type prefixes:
 *   events/<slug>.mdx, venues/<slug>.mdx, organisers/<slug>.mdx, blog/<slug>.mdx
 *
 * Two backends implement the same interface:
 *  - LocalFsStore   — reads ./content (default; runs with no cloud creds)
 *  - S3Store        — reads/writes an S3 bucket (used in deployment)
 *
 * The backend is chosen from the environment, so the rest of the app is
 * storage-agnostic.
 */
export interface StoredDoc {
  /** Key relative to the content root, e.g. "events/repair-cafe.mdx". */
  key: string;
  /** Slug derived from the filename (no prefix, no extension). */
  slug: string;
  /** Raw file contents (frontmatter + body). */
  raw: string;
}

export interface ContentStore {
  list(prefix: string): Promise<string[]>;
  read(key: string): Promise<string | null>;
  readPrefix(prefix: string): Promise<StoredDoc[]>;
  write(key: string, contents: string): Promise<void>;
  remove(key: string): Promise<void>;
}

const CONTENT_EXT = /\.(md|mdx)$/i;

function slugFromKey(key: string): string {
  return path.basename(key).replace(CONTENT_EXT, "");
}

// ── Local filesystem backend ────────────────────────────────────────────────
class LocalFsStore implements ContentStore {
  constructor(private root: string) {}

  private abs(key: string) {
    return path.join(this.root, key);
  }

  async list(prefix: string): Promise<string[]> {
    const dir = this.abs(prefix);
    try {
      const entries = await fs.readdir(dir);
      return entries
        .filter((e) => CONTENT_EXT.test(e))
        .map((e) => path.posix.join(prefix, e));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  async read(key: string): Promise<string | null> {
    try {
      return await fs.readFile(this.abs(key), "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async readPrefix(prefix: string): Promise<StoredDoc[]> {
    const keys = await this.list(prefix);
    const docs = await Promise.all(
      keys.map(async (key) => {
        const raw = await this.read(key);
        return raw == null ? null : { key, slug: slugFromKey(key), raw };
      }),
    );
    return docs.filter((d): d is StoredDoc => d !== null);
  }

  async write(key: string, contents: string): Promise<void> {
    const abs = this.abs(key);
    await fs.mkdir(path.dirname(abs), { recursive: true });
    await fs.writeFile(abs, contents, "utf8");
  }

  async remove(key: string): Promise<void> {
    try {
      await fs.unlink(this.abs(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
}

// ── S3 backend ──────────────────────────────────────────────────────────────
class S3Store implements ContentStore {
  // Lazy-loaded so the AWS SDK is only touched when S3 is configured.
  private clientPromise: Promise<import("@aws-sdk/client-s3").S3Client> | null =
    null;

  constructor(
    private bucket: string,
    private region: string,
  ) {}

  private async client() {
    if (!this.clientPromise) {
      this.clientPromise = import("@aws-sdk/client-s3").then(
        ({ S3Client }) => new S3Client({ region: this.region }),
      );
    }
    return this.clientPromise;
  }

  async list(prefix: string): Promise<string[]> {
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    const keys: string[] = [];
    let token: string | undefined;
    do {
      const out = await client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix.endsWith("/") ? prefix : `${prefix}/`,
          ContinuationToken: token,
        }),
      );
      for (const obj of out.Contents ?? []) {
        if (obj.Key && CONTENT_EXT.test(obj.Key)) keys.push(obj.Key);
      }
      token = out.IsTruncated ? out.NextContinuationToken : undefined;
    } while (token);
    return keys;
  }

  async read(key: string): Promise<string | null> {
    const { GetObjectCommand, NoSuchKey } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    try {
      const out = await client.send(
        new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      );
      return (await out.Body?.transformToString("utf8")) ?? null;
    } catch (err) {
      if (err instanceof NoSuchKey) return null;
      throw err;
    }
  }

  async readPrefix(prefix: string): Promise<StoredDoc[]> {
    const keys = await this.list(prefix);
    const docs = await Promise.all(
      keys.map(async (key) => {
        const raw = await this.read(key);
        return raw == null ? null : { key, slug: slugFromKey(key), raw };
      }),
    );
    return docs.filter((d): d is StoredDoc => d !== null);
  }

  async write(key: string, contents: string): Promise<void> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: contents,
        ContentType: "text/markdown; charset=utf-8",
      }),
    );
  }

  async remove(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────
let store: ContentStore | null = null;

export function getStore(): ContentStore {
  if (store) return store;
  const bucket = process.env.S3_CONTENT_BUCKET;
  // During `next build` the (credential-less) build container reads the
  // committed `content/` seed; at runtime we read/write S3 (design D4). The
  // seed equals the S3 state at deploy, and time-based ISR reconciles any
  // post-deploy edits, so this build/runtime split is freshness-safe.
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (bucket && !isBuild) {
    store = new S3Store(bucket, process.env.AWS_REGION ?? "eu-central-1");
  } else {
    store = new LocalFsStore(path.join(process.cwd(), "content"));
  }
  return store;
}

export const CONTENT_PREFIX = {
  event: "events",
  venue: "venues",
  organiser: "organisers",
  blog: "blog",
  project: "projects",
} as const;
