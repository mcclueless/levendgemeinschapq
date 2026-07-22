import Image, { type StaticImageData } from "next/image";

/**
 * Homepage photography (restyle-homepage-photo-panels).
 *
 * The device is borrowed from the organisation's predecessor site — a
 * photograph paired with a flat colour panel, the photograph washed in a flat
 * colour so images of differing origin and quality read as one deliberate
 * treatment. The *colour* is ours: `--color-brand-strong`, not the reference
 * site's blue, which is what keeps this a homepage change and not a palette
 * change (design D1). No new tokens.
 *
 * Homepage-scoped on purpose: a device used on exactly one page does not belong
 * in the shared library until a second page wants it (design D8).
 */

/** The wash: brand green over the photograph, plus a lift so it tints rather
 *  than muddies. Shared by both treatments below. */
function Wash() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-brand-strong/70 mix-blend-multiply"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-tr from-brand-strong/45 via-brand-strong/10 to-transparent"
      />
    </>
  );
}

/**
 * Split panel: photograph beside a flat colour panel carrying the text.
 *
 * Text lives on the flat panel, never over the photograph, so contrast is a
 * property of the token pair (white on brand-strong = 8.14:1) rather than of
 * whatever the image happens to contain (design D2).
 */
export function PhotoPanel({
  image,
  alt,
  /**
   * Crop origin. The homepage photographs are different shapes and one rule
   * would spoil one of them — see PhotoBand (design D6).
   */
  objectPosition = "50% 50%",
  /** Only the hero preloads. */
  priority = false,
  children,
}: {
  image: StaticImageData;
  alt: string;
  objectPosition?: string;
  priority?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[15rem] lg:min-h-[34rem]">
          <Image
            src={image}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            style={{ objectPosition }}
          />
          <Wash />
        </div>

        <div className="flex items-center bg-brand-strong px-6 py-14 text-white sm:px-10 lg:px-14 lg:py-20">
          <div className="w-full max-w-xl">{children}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * Full-width photographic band, carrying no text.
 *
 * Used to separate the events and projects sections. Deliberately textless: the
 * change may not add, remove or duplicate any wording on the page (design D7),
 * and giving this band a heading would have repeated the projects section's own
 * title a second time.
 */
export function PhotoBand({
  image,
  alt,
  objectPosition = "50% 50%",
}: {
  image: StaticImageData;
  alt: string;
  objectPosition?: string;
}) {
  return (
    <section className="relative isolate h-56 overflow-hidden sm:h-72 lg:h-80">
      <Image
        src={image}
        alt={alt}
        fill
        sizes="100vw"
        className="object-cover"
        style={{ objectPosition }}
      />
      <Wash />
    </section>
  );
}
