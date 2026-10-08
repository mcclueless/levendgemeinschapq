import { MAX_UPLOAD_LABEL, UPLOAD_FORMATS } from "@/content/upload-rules";

/**
 * Advice on the image to upload, shown in the info panel beside a cover or logo
 * field (image-guidance D2, D3). Holds no data, so it is safe on the public
 * submission form. File types and size come from `upload-rules.ts`, the same
 * rules the upload check enforces.
 *
 * The cover's safe area — the central 1440 × 960 of a 1920 × 1080 file — is
 * where every surface's crop overlaps, measured on goeddoen.net on 2026-10-08:
 * detail pages cut a 16:9 cover to 2:1, the homepage's project cards to about
 * 1.35:1. A layout change that shows covers in another shape must be checked
 * against it.
 */
export function ImageGuidance({ kind }: { kind: "cover" | "logo" }) {
  const formats = `${UPLOAD_FORMATS.slice(0, -1).join(", ")} of ${UPLOAD_FORMATS.at(-1)}`;

  if (kind === "logo") {
    return (
      <div className="grid gap-2 text-sm text-ink">
        <p>
          <strong>Beste formaat: 1920 × 1080 pixels (16:9).</strong> Het logo wordt altijd
          helemaal getoond en nooit bijgesneden, op een wit vlak. Een logo van 16:9 vult de kaart
          precies.
        </p>
        <p>Een witte of doorzichtige achtergrond werkt het best.</p>
        <p className="text-muted">
          {formats}, maximaal {MAX_UPLOAD_LABEL}.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 text-sm text-ink">
      <p>
        <strong>Beste formaat: 1920 × 1080 pixels (16:9).</strong> De site toont de afbeelding op
        verschillende plekken in iets andere vormen, en snijdt daarbij soms een stukje van de
        randen af.
      </p>
      <figure className="grid gap-1.5">
        <SafeArea />
        <figcaption>
          Houd tekst, gezichten en logo&apos;s binnen het middelste deel van 1440 × 960 pixels. Wat
          daarbuiten valt, kan op sommige pagina&apos;s wegvallen.
        </figcaption>
      </figure>
      <p className="text-muted">
        {formats}, maximaal {MAX_UPLOAD_LABEL}.
      </p>
    </div>
  );
}

/**
 * A 1920 × 1080 frame at 1/10 scale with the central 1440 × 960 outlined. The
 * caption carries the same advice in words, so the picture is decorative.
 */
function SafeArea() {
  return (
    <svg
      viewBox="0 0 192 108"
      aria-hidden="true"
      className="w-full max-w-xs rounded-md border border-border"
    >
      <rect x="0" y="0" width="192" height="108" className="fill-surface-2" />
      <rect x="24" y="6" width="144" height="96" className="fill-surface" />
      <rect
        x="24"
        y="6"
        width="144"
        height="96"
        fill="none"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        className="stroke-brand-strong"
      />
      <text x="96" y="52" textAnchor="middle" className="fill-ink" fontSize="9">
        veilig: 1440 × 960
      </text>
      <text x="96" y="64" textAnchor="middle" className="fill-muted" fontSize="7">
        randen kunnen wegvallen
      </text>
    </svg>
  );
}
