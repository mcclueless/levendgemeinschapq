import { randomBytes } from "node:crypto";
import matter from "gray-matter";
import { z } from "zod";
import { getStore, type ContentStore } from "./storage";

/**
 * Organisation accounts (organisation-accounts D1).
 *
 * An account is a document under its own prefix, like a feed: it is not a
 * `ContentType`, so the lists, counts, index, trash, reference guards and
 * sitemap never see one. It reuses `getStore()`, so accounts live in the same
 * S3 bucket in production and under `content/users/` locally — a folder that
 * is git-ignored, because the document carries a password hash.
 *
 * The id is random, never derived from the email: two distinct addresses can
 * slugify to one value, so uniqueness is checked on the email itself,
 * lower-cased, across every account.
 */

export const USER_PREFIX = "users";

export const UserFrontmatter = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  /** The organiser slug the account is scoped to (user-roles-approval). */
  organisation: z.string().min(1),
  passwordHash: z.string().min(1),
  /** Sessions issued before this moment are refused (D4). */
  passwordChangedAt: z.coerce.date(),
  disabled: z.boolean().default(false),
  createdAt: z.coerce.date(),
});
export type UserFrontmatter = z.infer<typeof UserFrontmatter>;

export interface User extends UserFrontmatter {
  id: string;
}

function keyFor(id: string): string {
  return `${USER_PREFIX}/${id}.mdx`;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

function serialize(data: Record<string, unknown>): string {
  const clean = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== undefined && v !== ""),
  );
  return matter.stringify("\n", clean);
}

function parse(id: string, raw: string): User | null {
  const parsed = UserFrontmatter.safeParse(matter(raw).data);
  return parsed.success ? { id, ...parsed.data } : null;
}

export async function listUsers(store: ContentStore = getStore()): Promise<User[]> {
  const docs = await store.readPrefix(USER_PREFIX);
  const users: User[] = [];
  for (const doc of docs) {
    const user = parse(doc.slug, doc.raw);
    if (!user) {
      console.error(`[users] skipped invalid account: ${doc.key}`);
      continue;
    }
    users.push(user);
  }
  return users.sort((a, b) => a.name.localeCompare(b.name, "nl"));
}

export async function getUser(id: string, store: ContentStore = getStore()): Promise<User | null> {
  // An id is a hex string this module made; anything else cannot be a key.
  if (!/^[0-9a-f]{32}$/.test(id)) return null;
  const raw = await store.read(keyFor(id));
  return raw == null ? null : parse(id, raw);
}

/** The account with this email in any letter case, or null. */
export async function getUserByEmail(
  email: string,
  store: ContentStore = getStore(),
): Promise<User | null> {
  const wanted = normaliseEmail(email);
  if (!wanted) return null;
  return (await listUsers(store)).find((u) => normaliseEmail(u.email) === wanted) ?? null;
}

export type CreateUserResult =
  | { ok: true; id: string }
  | { ok: false; reason: "email-taken" | "email-invalid" };

export async function createUser(
  data: { email: string; name: string; organisation: string; passwordHash: string },
  store: ContentStore = getStore(),
  now: Date = new Date(),
): Promise<CreateUserResult> {
  const email = normaliseEmail(data.email);
  if (!z.string().email().safeParse(email).success) return { ok: false, reason: "email-invalid" };
  if (await getUserByEmail(email, store)) return { ok: false, reason: "email-taken" };
  const id = randomBytes(16).toString("hex");
  await store.write(
    keyFor(id),
    serialize({
      email,
      name: data.name.trim(),
      organisation: data.organisation,
      passwordHash: data.passwordHash,
      passwordChangedAt: now.toISOString(),
      disabled: false,
      createdAt: now.toISOString(),
    }),
  );
  return { ok: true, id };
}

async function patch(id: string, fields: Record<string, unknown>, store: ContentStore) {
  const raw = await store.read(keyFor(id));
  if (raw == null) throw new Error(`Account not found: ${id}`);
  await store.write(keyFor(id), serialize({ ...matter(raw).data, ...fields }));
}

/** A new hash; sessions issued before `now` stop being valid (D4). */
export async function setPassword(
  id: string,
  passwordHash: string,
  store: ContentStore = getStore(),
  now: Date = new Date(),
): Promise<void> {
  await patch(id, { passwordHash, passwordChangedAt: now.toISOString() }, store);
}

export async function setDisabled(
  id: string,
  disabled: boolean,
  store: ContentStore = getStore(),
): Promise<void> {
  await patch(id, { disabled }, store);
}

/**
 * Move every account of organisation `from` to `to` (organisation-accounts
 * D10): the follow-through of a permalink change. Returns the ids moved.
 */
export async function moveUsersToOrganisation(
  from: string,
  to: string,
  store: ContentStore = getStore(),
): Promise<string[]> {
  const moved: string[] = [];
  for (const user of await listUsers(store)) {
    if (user.organisation !== from) continue;
    await patch(user.id, { organisation: to }, store);
    moved.push(user.id);
  }
  return moved;
}
