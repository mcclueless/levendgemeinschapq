/**
 * Full reindex command (design D3): rebuild the derived content index from the
 * source-of-truth documents and persist the snapshot.
 *
 *   pnpm reindex
 */
import { writeIndex } from "../src/content/index-build.ts";

const index = await writeIndex();
console.log("Reindex complete:", index.counts);
