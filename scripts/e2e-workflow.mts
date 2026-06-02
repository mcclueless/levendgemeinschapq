/**
 * End-to-end check of the submission → approval write path (no HTTP layer):
 * create a pending event, assert it's pending, approve it, assert it's
 * published, then clean up. Run: pnpm tsx scripts/e2e-workflow.mts
 */
import matter from "gray-matter";
import { createDocument, setStatus } from "../src/content/write.ts";
import { getStore, CONTENT_PREFIX } from "../src/content/storage.ts";

const store = getStore();

function status(raw: string | null): string | undefined {
  return raw ? (matter(raw).data.status as string) : undefined;
}

// 1. Public submission → pending
const { slug, key } = await createDocument(
  "event",
  "E2E Testevenement",
  {
    title: "E2E Testevenement",
    start: "2026-07-01T18:00:00+02:00",
    venue: "de-brink",
    organiser: "stichting-anker",
    status: "pending",
    submittedBy: "e2e",
    submittedAt: new Date().toISOString(),
  },
  "Een testevenement.",
);
const afterCreate = status(await store.read(key));
console.log(`created ${key} -> status=${afterCreate}`);
if (afterCreate !== "pending") throw new Error("expected pending after submit");

// 2. Admin approval → published
await setStatus("event", slug, "published", { reviewNote: undefined });
const afterApprove = status(await store.read(key));
console.log(`approved ${slug} -> status=${afterApprove}`);
if (afterApprove !== "published") throw new Error("expected published after approve");

// 3. Cleanup
await store.remove(`${CONTENT_PREFIX.event}/${slug}.mdx`);
console.log("cleanup ok");
console.log("E2E PASS: submit(pending) -> approve(published)");
