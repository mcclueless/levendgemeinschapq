import "server-only";
import { revalidatePath } from "next/cache";
import { routes } from "@/lib/routes";
import type { CalendarEvent } from "./types";

/**
 * Publish-time freshness (design D4). When content is published or updated we
 * revalidate the affected Next pages (ISR) and, in production, issue a
 * CloudFront invalidation for the same paths. Public content is otherwise
 * served from cache/CDN.
 *
 * Default revalidation window for listing pages (seconds).
 */
export const LISTING_REVALIDATE = 600;

/** Paths impacted by publishing/updating an event. */
export function eventPaths(event: CalendarEvent): string[] {
  const paths = new Set<string>([
    routes.agenda,
    routes.event(event.slug),
    "/", // homepage shows an upcoming preview
  ]);
  if (event.venue) paths.add(routes.venue(event.venue.slug));
  if (event.organiser) paths.add(routes.organiser(event.organiser.slug));
  return [...paths];
}

/** Revalidate ISR pages and invalidate the CDN for the given paths. */
export async function revalidateContent(paths: string[]): Promise<void> {
  for (const p of paths) revalidatePath(p);
  await invalidateCdn(paths);
}

/**
 * Revalidate the main public surfaces after a publish/approve when the precise
 * affected entity isn't threaded through. Broad but bounded; writes are rare.
 */
export async function revalidatePublic(): Promise<void> {
  await revalidateContent([
    "/",
    routes.agenda,
    routes.venues,
    routes.organisers,
    routes.blog,
  ]);
}

async function invalidateCdn(paths: string[]): Promise<void> {
  const distributionId = process.env.CLOUDFRONT_DISTRIBUTION_ID;
  if (!distributionId || paths.length === 0) return; // no-op without a CDN configured

  const { CloudFrontClient, CreateInvalidationCommand } = await import(
    "@aws-sdk/client-cloudfront"
  );
  const client = new CloudFrontClient({
    region: process.env.AWS_REGION ?? "eu-central-1",
  });
  await client.send(
    new CreateInvalidationCommand({
      DistributionId: distributionId,
      InvalidationBatch: {
        // A stable, unique reference per publish batch.
        CallerReference: `publish-${paths.join("|")}-${Date.now()}`,
        Paths: { Quantity: paths.length, Items: paths },
      },
    }),
  );
}
