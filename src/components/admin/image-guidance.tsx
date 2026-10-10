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

  // Wording from the tester, 8 October 2026 (image-guidance, revised).
  const accepted = (
    <p className="text-muted">
      Geaccepteerde formaten: {formats}; maximaal {MAX_UPLOAD_LABEL}.
    </p>
  );

  if (kind === "logo") {
    return (
      <div className="grid gap-2 text-sm text-ink">
        <p>
          <strong>Beste formaat: 1920 × 1080 pixels (16:9).</strong> Het logo wordt altijd
          volledig weergegeven – geschaald, maar nooit bijgesneden – tegen een witte achtergrond.
          Een logo in 16:9-verhouding vult de kaart perfect.
        </p>
        <p>Een witte of transparante achtergrond werkt het best.</p>
        {accepted}
      </div>
    );
  }

  return (
    <div className="grid gap-3 text-sm text-ink">
      <p>
        <strong>Beste formaat: 1920 × 1080 pixels (16:9).</strong> Houd tekst, gezichten en
        logo&apos;s binnen het middelste deel van 1440 × 960 pixels.
      </p>
      <p>
        De site toont de afbeelding op verschillende plekken in iets andere vormen, en snijdt daarbij
        soms een stukje van de randen af. Wat buiten het middelste deel valt, kan op sommige
        pagina&apos;s wegvallen.
      </p>
      <SafeArea />
      {accepted}
    </div>
  );
}

/**
 * The full 1920 × 1080 frame at 1/10 scale, labelled, with the central
 * 1440 × 960 outlined and labelled inside it. The text above carries the same
 * advice in words, so the picture is decorative.
 */
function SafeArea() {
  return (
    <svg
      viewBox="0 0 192 108"
      aria-hidden="true"
      className="w-full max-w-xs rounded-md"
    >
      <rect
        x="0.5"
        y="0.5"
        width="191"
        height="107"
        rx="3"
        strokeWidth="1"
        className="fill-surface-2 stroke-muted"
      />
      <rect x="24" y="6" width="144" height="96" className="fill-surface" />
      <text x="96" textAnchor="middle" fontSize="5.5" className="fill-ink">
        <tspan x="96" y="106.5">1920 × 1080</tspan>
      </text>
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
