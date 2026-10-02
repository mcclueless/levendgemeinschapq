import { cn } from "@/lib/cn";
import { DescribedImage } from "./described-image";

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
    <DescribedImage
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("w-full object-cover", className)}
    />
  );
}
