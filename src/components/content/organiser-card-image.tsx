import { cn } from "@/lib/cn";
import { organiserCardImage } from "@/content/organiser-images";
import { CoverImage } from "./cover-image";
import { DescribedImage } from "./described-image";

/**
 * The image area of an organiser card (organiser-card-logo D1, D2): the logo,
 * whole on a neutral padded panel; else the cover, cropped to fill as any
 * cover; else the organiser's name on a brand panel. One component for the
 * organisers overview and the homepage, so the two cannot drift apart. The
 * caller sets the height so each page keeps its own grid rhythm (D3).
 */
export function OrganiserCardImage({
  organiser,
  heightClass,
}: {
  organiser: { name: string; logo?: string; featuredImage?: string };
  heightClass: string;
}) {
  const image = organiserCardImage(organiser);

  if (image.kind === "logo") {
    return (
      <div className={cn("flex items-center justify-center bg-surface-2 p-6", heightClass)}>
        <DescribedImage
          src={image.src}
          alt={organiser.name}
          loading="lazy"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    );
  }

  if (image.kind === "cover") {
    return <CoverImage src={image.src} alt={organiser.name} className={heightClass} />;
  }

  return (
    <div className={cn("flex items-center justify-center bg-brand-strong p-6 text-center", heightClass)}>
      <span className="font-display text-xl font-semibold text-white">{organiser.name}</span>
    </div>
  );
}
