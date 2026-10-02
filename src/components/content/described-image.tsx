import { imageAlt } from "@/content/media-details";

/**
 * An `<img>` whose text alternative is the image's own description when an
 * editor gave it one, and `alt` otherwise (gallery-find-and-describe D9). A
 * server component: the description is looked up while the page renders, so an
 * image without one renders exactly as before.
 */
export async function DescribedImage({
  src,
  detailsOf = src,
  alt,
  ...rest
}: Omit<React.ComponentProps<"img">, "src" | "alt"> & {
  src: string;
  /** The stored image whose description to use, when `src` may be a fallback picture. */
  detailsOf?: string;
  alt: string;
}) {
  const text = await imageAlt(detailsOf, alt);
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={text} {...rest} />;
}
