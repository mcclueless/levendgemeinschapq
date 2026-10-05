"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const control =
  "inline-flex items-center justify-center rounded-full bg-surface/90 text-ink shadow-sm ring-1 ring-border hover:bg-surface focus-visible:outline-3 focus-visible:outline-offset-2";

/**
 * A manual slideshow (organiser-page-layout D4). The track is a horizontal
 * scroll-snap list, so it swipes and scrolls without JavaScript; the previous,
 * next and per-slide buttons move it. It never advances on its own, so it needs
 * no pause control. One image is shown plainly, none renders nothing.
 */
export function Slideshow({
  images,
  alt,
  alts,
  captions,
  className,
}: {
  images: string[];
  /** Base alternative text; each slide adds "— afbeelding n". */
  alt: string;
  /**
   * The text alternative per slide, resolved on the server from each image's
   * own description (gallery-find-and-describe D9); this component runs in the
   * browser and cannot look it up. Absent, the base text is used.
   */
  alts?: string[];
  /**
   * The caption per slide, resolved on the server from each image's details
   * (organiser-slide-captions D3), shown beneath the image. A slide without
   * one shows no caption area.
   */
  captions?: string[];
  className?: string;
}) {
  const caption = (i: number) => {
    const text = captions?.[i]?.trim();
    return text ? <figcaption className="mt-2 text-sm text-muted">{text}</figcaption> : null;
  };
  const track = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);

  // Follow scrolling, including swipes, so the dots show the slide in view.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setCurrent(Math.round(el.scrollLeft / Math.max(el.clientWidth, 1)));
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <figure className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[0]}
          alt={alts?.[0] ?? alt}
          className="aspect-[2/1] w-full rounded-xl object-cover"
        />
        {caption(0)}
      </figure>
    );
  }

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const target = (i + images.length) % images.length;
    el.scrollTo({ left: target * el.clientWidth, behavior: "smooth" });
    setCurrent(target);
  };

  return (
    <section aria-roledescription="diavoorstelling" aria-label={alt} className={cn("grid gap-3", className)}>
      <div className="relative">
        <ul
          ref={track}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {images.map((src, i) => (
            <li
              key={src}
              aria-roledescription="dia"
              aria-label={`${i + 1} van ${images.length}`}
              className="w-full shrink-0 snap-start"
            >
              {/* The caption scrolls with its slide, so it is right without
                  scripts too. */}
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={alts?.[i] ?? `${alt} — afbeelding ${i + 1}`}
                  loading={i === 0 ? undefined : "lazy"}
                  className="aspect-[2/1] w-full rounded-xl object-cover"
                />
                {caption(i)}
              </figure>
            </li>
          ))}
        </ul>
        {/* The same shape as the image, so the buttons stay centred on the
            picture when a caption makes the slide taller. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 aspect-[2/1]">
          <button
            type="button"
            onClick={() => go(current - 1)}
            aria-label="Vorige afbeelding"
            className={cn(control, "pointer-events-auto absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2")}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <button
            type="button"
            onClick={() => go(current + 1)}
            aria-label="Volgende afbeelding"
            className={cn(control, "pointer-events-auto absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2")}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <div className="flex justify-center gap-1">
        {images.map((src, i) => (
          // A 24px target around a small dot (WCAG 2.5.8).
          <button
            key={src}
            type="button"
            onClick={() => go(i)}
            aria-label={`Afbeelding ${i + 1} van ${images.length}`}
            aria-current={i === current ? "true" : undefined}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full focus-visible:outline-3 focus-visible:outline-offset-1"
          >
            <span
              aria-hidden="true"
              className={cn(
                "h-2.5 w-2.5 rounded-full ring-1 ring-border",
                i === current ? "bg-brand" : "bg-surface-2",
              )}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
