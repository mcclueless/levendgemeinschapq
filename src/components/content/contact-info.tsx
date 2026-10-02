import { Fragment } from "react";

/**
 * A value with soft break points after "@" and "/", so an email or web address
 * wraps at a natural place before it would break mid-word.
 */
function breakable(value: string) {
  return value.split(/(?<=[@/])/).map((part, i) => (
    <Fragment key={i}>
      {i > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

/**
 * Contact details block shared by Venue and Organiser pages. Renders only the
 * fields that are present (venues/organisers specs: optional contact fields).
 */
export function ContactInfo({
  phone,
  email,
  website,
  address,
  location,
}: {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  /** Linked Location (Organiser): a venue name + internal page href. */
  location?: { name: string; href: string };
}) {
  const items: Array<{ label: string; value: string; href?: string }> = [];
  if (address) items.push({ label: "Adres", value: address });
  if (location)
    items.push({ label: "Locatie", value: location.name, href: location.href });
  if (phone) items.push({ label: "Telefoon", value: phone, href: `tel:${phone}` });
  if (email) items.push({ label: "E-mail", value: email, href: `mailto:${email}` });
  if (website)
    items.push({
      label: "Website",
      value: website.replace(/^https?:\/\//, ""),
      href: website,
    });

  if (items.length === 0) return null;

  return (
    <dl className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex gap-3 text-sm">
          <dt className="w-24 shrink-0 font-medium text-muted">{item.label}</dt>
          {/* An email or web address has no spaces to wrap at; let it shrink
              and break anywhere rather than run past the card's edge. */}
          <dd className="min-w-0 [overflow-wrap:anywhere]">
            {item.href ? (
              <a
                href={item.href}
                className="text-brand-strong underline-offset-2 hover:underline"
                {...(item.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {breakable(item.value)}
              </a>
            ) : (
              item.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
