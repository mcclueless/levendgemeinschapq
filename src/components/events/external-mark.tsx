import { externalHost } from "@/content/event-mode";

/**
 * The mark on an event that leads to another site (event-external-link D3): a
 * visible "↗" for everyone, and the site's name for assistive technology, so
 * leaving Goeddoen is never a surprise. Belongs inside the link, so the name of
 * the site is part of the link's accessible name.
 */
export function ExternalMark({ url }: { url: string }) {
  const host = externalHost(url);
  return (
    <>
      {" "}
      <span aria-hidden="true">↗</span>
      <span className="sr-only">
        {host ? `(opent website van ${host})` : "(opent een andere website)"}
      </span>
    </>
  );
}
