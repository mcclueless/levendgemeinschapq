import { organiserCardImage } from "@/content/organiser-images";
import { CoverImage } from "./cover-image";
import { DescribedImage } from "./described-image";

/**
 * The image area of an organiser card (organiser-card-logo D1–D3, revised
 * 2026-10-08): a 16:9 area on every page. The logo is shown whole on a white,
 * unpadded panel, so a logo exported at 16:9 (the team's image rule) fills it
 * edge to edge and a transparent mark sits centred; else the cover, cropped to
 * fill; else the organiser's name on a brand panel. One component for the
 * organisers overview and the homepage, so the two cannot drift apart.
 */
export function OrganiserCardImage({
  organiser,
}: {
  organiser: { name: string; logo?: string; featuredImage?: string };
}) {
  const image = organiserCardImage(organiser);

  if (image.kind === "logo") {
    return (
      <div className="flex aspect-video items-center justify-center bg-surface">
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
    return <CoverImage src={image.src} alt={organiser.name} className="aspect-video" />;
  }

  return (
    <div className="flex aspect-video items-center justify-center bg-brand-strong p-6 text-center">
      <span className="font-display text-xl font-semibold text-white">{organiser.name}</span>
    </div>
  );
}
