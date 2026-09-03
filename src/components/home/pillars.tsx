import Image, { type StaticImageData } from "next/image";
import { SectionHeading } from "@/components/ui/section-heading";
import muziek from "../../../public/home/pillar-muziek.webp";
import ontmoeting from "../../../public/home/pillar-ontmoeting.webp";
import natuur from "../../../public/home/pillar-natuur.webp";

/**
 * "Wat we doen" — the organisation's three pillars
 * (restyle-homepage-community-pillars, design D2).
 *
 * Static image tiles borrowed from the predecessor site's "what we do" section.
 * Each label sits on a deterministic dark scrim over the photograph, so its
 * contrast is guaranteed by the scrim rather than by whatever the image happens
 * to contain — the homepage contrast requirement holds without the old wash.
 * The tiles are not links (the pillars are descriptive, not navigational).
 */
const PILLARS: { image: StaticImageData; label: string }[] = [
  { image: muziek, label: "Muziek & Concerten" },
  { image: ontmoeting, label: "Sociale Ontmoetingen" },
  { image: natuur, label: "Tuinen & Natuur" },
];

export function Pillars() {
  return (
    <section>
      <SectionHeading
        title="Wat we doen"
        subtitle="Goeddoen richt zich op drie pijlers."
      />

      <div className="grid gap-6 sm:grid-cols-3">
        {PILLARS.map(({ image, label }) => (
          <div
            key={label}
            className="relative isolate aspect-[4/3] overflow-hidden rounded-lg shadow-card"
          >
            <Image
              src={image}
              alt={label}
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover"
            />
            {/* Deterministic scrim: legibility never rides on the photograph. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent"
            />
            {/* text-white is explicit: globals.css sets `h1..h4 { color: ink }`
                in the base layer, which a utility class beats. */}
            <h3 className="absolute inset-x-0 bottom-0 p-5 text-2xl font-semibold text-white">
              {label}
            </h3>
          </div>
        ))}
      </div>
    </section>
  );
}
