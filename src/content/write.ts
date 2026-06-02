import matter from "gray-matter";
import { CONTENT_PREFIX, getStore } from "./storage";
import type { ContentType, PublishStatus } from "./schema";

/**
 * Content authoring (design D2/D4). Writes MD/MDX documents back to the store
 * and updates publication state, so the editorial backend and approval queue
 * have a single, validated write path.
 */

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function keyFor(type: ContentType, slug: string): string {
  return `${CONTENT_PREFIX[type]}/${slug}.mdx`;
}

/** Ensure a unique slug within a content type. */
async function uniqueSlug(type: ContentType, base: string): Promise<string> {
  const store = getStore();
  let slug = base || "item";
  let n = 2;
  while ((await store.read(keyFor(type, slug))) !== null) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

/** Serialize frontmatter + body into an MDX document string. */
function serialize(frontmatter: Record<string, unknown>, body: string): string {
  // Drop undefined values so they don't appear as `null` in YAML.
  const clean = Object.fromEntries(
    Object.entries(frontmatter).filter(([, v]) => v !== undefined && v !== ""),
  );
  return matter.stringify(body.trim() ? `\n${body.trim()}\n` : "\n", clean);
}

export interface CreateResult {
  slug: string;
  key: string;
}

/** Create a new document of `type`. Returns the assigned slug. */
export async function createDocument(
  type: ContentType,
  titleForSlug: string,
  frontmatter: Record<string, unknown>,
  body = "",
): Promise<CreateResult> {
  const slug = await uniqueSlug(type, slugify(titleForSlug));
  const key = keyFor(type, slug);
  await getStore().write(key, serialize(frontmatter, body));
  return { slug, key };
}

/** Patch a document's frontmatter (e.g. status changes) in place. */
export async function patchFrontmatter(
  type: ContentType,
  slug: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const store = getStore();
  const key = keyFor(type, slug);
  const raw = await store.read(key);
  if (raw == null) throw new Error(`Document not found: ${key}`);
  const { data, content } = matter(raw);
  await store.write(key, serialize({ ...data, ...patch }, content));
}

export async function setStatus(
  type: ContentType,
  slug: string,
  status: PublishStatus,
  extra: Record<string, unknown> = {},
): Promise<void> {
  await patchFrontmatter(type, slug, { status, ...extra });
}
