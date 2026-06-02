import matter from "gray-matter";
import { z } from "zod";
import { frontmatterByType, type ContentType } from "./schema";
import type { StoredDoc } from "./storage";

/** A parsed document: validated frontmatter + the MDX body. */
export interface ParsedDoc<T> {
  slug: string;
  key: string;
  data: T;
  body: string;
}

type FrontmatterOf<K extends ContentType> = z.infer<
  (typeof frontmatterByType)[K]
>;

/**
 * Split frontmatter from body and validate against the schema for `type`.
 * Throws a descriptive error for malformed documents (content-storage spec).
 */
export function parseDoc<K extends ContentType>(
  type: K,
  doc: StoredDoc,
): ParsedDoc<FrontmatterOf<K>> {
  const { data, content } = matter(doc.raw);
  const schema = frontmatterByType[type];
  const result = schema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Invalid ${type} frontmatter in "${doc.key}": ${issues}`,
    );
  }
  return {
    slug: doc.slug,
    key: doc.key,
    data: result.data as FrontmatterOf<K>,
    body: content,
  };
}

/** Parse many docs, skipping (and logging) any that fail validation. */
export function parseAll<K extends ContentType>(
  type: K,
  docs: StoredDoc[],
): ParsedDoc<FrontmatterOf<K>>[] {
  const out: ParsedDoc<FrontmatterOf<K>>[] = [];
  for (const doc of docs) {
    try {
      out.push(parseDoc(type, doc));
    } catch (err) {
      console.error(`[content] skipped invalid document: ${(err as Error).message}`);
    }
  }
  return out;
}
