/**
 * Image gallery for Venue pages (venues spec). Renders nothing when there are
 * no images, so the page degrades gracefully.
 */
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  if (!images || images.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((src, i) => (
        <li key={src} className="overflow-hidden rounded-md border border-border">
          {/* next/image optimization wired with the media CDN in Group 10. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${alt} — foto ${i + 1}`}
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
