import { cn } from "@/lib/cn";

/**
 * Cover/featured image for content (venues, organisers, blog posts). Renders
 * nothing when no image is set, so layouts stay clean for imageless items.
 * Plain <img>; next/image optimization is wired once the media CDN exists.
 */
export function CoverImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("w-full object-cover", className)}
    />
  );
}
