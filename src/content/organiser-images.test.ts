import test from "node:test";
import assert from "node:assert/strict";
import matter from "gray-matter";
import { OrganiserFrontmatter } from "./schema";
import {
  organiserCardImage,
  organiserGallery,
  organiserImageFields,
  organiserImages,
} from "./organiser-images";
import { imageReferencesIn } from "./image-references";
import { mergeDocument } from "./write";

/** An organiser's images and logo (organiser-page-layout). */

test("an organiser without images has none", () => {
  assert.deepEqual(organiserImages({}), []);
});

test("a cover alone is the only image", () => {
  assert.deepEqual(organiserImages({ featuredImage: "/a.jpg" }), ["/a.jpg"]);
});

test("further images follow the cover in order", () => {
  assert.deepEqual(organiserImages({ featuredImage: "/a.jpg", moreImages: ["/b.jpg", "/c.jpg"] }), [
    "/a.jpg",
    "/b.jpg",
    "/c.jpg",
  ]);
});

test("a duplicate image appears once", () => {
  assert.deepEqual(organiserImages({ featuredImage: "/a.jpg", moreImages: ["/a.jpg", "/b.jpg"] }), [
    "/a.jpg",
    "/b.jpg",
  ]);
});

test("an organiser stored before the new fields still parses, without them", () => {
  const data = OrganiserFrontmatter.parse({ name: "VIND", featuredImage: "/a.jpg" });
  assert.equal(data.moreImages, undefined);
  assert.equal(data.logo, undefined);
  assert.deepEqual(organiserImages(data), ["/a.jpg"]);
});

test("no posted images clear both fields", () => {
  assert.deepEqual(organiserImageFields([]), { featuredImage: undefined, moreImages: undefined });
});

test("one posted image is only the cover", () => {
  assert.deepEqual(organiserImageFields(["/a.jpg"]), { featuredImage: "/a.jpg", moreImages: undefined });
});

test("several posted images keep their order, first as cover", () => {
  assert.deepEqual(organiserImageFields(["/b.jpg", "/a.jpg", "/c.jpg"]), {
    featuredImage: "/b.jpg",
    moreImages: ["/a.jpg", "/c.jpg"],
  });
});

test("duplicate and empty posted images are dropped", () => {
  assert.deepEqual(organiserImageFields(["/a.jpg", "", "/a.jpg", "/b.jpg"]), {
    featuredImage: "/a.jpg",
    moreImages: ["/b.jpg"],
  });
});

test("saving fewer images clears the stored further images", () => {
  const raw = matter.stringify("\nTekst\n", {
    name: "VIND",
    featuredImage: "/a.jpg",
    moreImages: ["/b.jpg", "/c.jpg"],
  });
  const one = matter(mergeDocument(raw, organiserImageFields(["/c.jpg"]), "Tekst")).data;
  assert.equal(one.featuredImage, "/c.jpg");
  assert.equal("moreImages" in one, false);
  const none = matter(mergeDocument(raw, organiserImageFields([]), "Tekst")).data;
  assert.equal("featuredImage" in none, false);
});

test("an image used only as an organiser's logo or later slide is in use", () => {
  const user = (data: { featuredImage?: string; moreImages?: string[]; logo?: string }) => ({
    kind: "organiser" as const,
    slug: "vind",
    title: "VIND Community",
    href: "/organisatoren/vind",
    cover: data.featuredImage,
    gallery: organiserGallery(data),
    body: "",
  });
  const logo = imageReferencesIn("/logo.png", [user({ featuredImage: "/a.jpg", logo: "/logo.png" })]);
  assert.deepEqual(logo.map((r) => r.slug), ["vind"]);
  const slide = imageReferencesIn("/c.jpg", [user({ featuredImage: "/a.jpg", moreImages: ["/b.jpg", "/c.jpg"] })]);
  assert.deepEqual(slide.map((r) => r.slug), ["vind"]);
  assert.deepEqual(imageReferencesIn("/other.jpg", [user({ featuredImage: "/a.jpg", logo: "/logo.png" })]), []);
});

/** The card image chain: logo, then cover, then the name (organiser-card-logo). */

test("a card shows the logo when there is one, even with a cover", () => {
  assert.deepEqual(organiserCardImage({ logo: "/l.png", featuredImage: "/a.jpg" }), {
    kind: "logo",
    src: "/l.png",
  });
});

test("a card without a logo shows the cover", () => {
  assert.deepEqual(organiserCardImage({ featuredImage: "/a.jpg", moreImages: ["/b.jpg"] }), {
    kind: "cover",
    src: "/a.jpg",
  });
});

test("a card with neither shows the name", () => {
  assert.deepEqual(organiserCardImage({}), { kind: "name" });
});

test("an empty logo counts as absent", () => {
  assert.deepEqual(organiserCardImage({ logo: "  ", featuredImage: "/a.jpg" }), {
    kind: "cover",
    src: "/a.jpg",
  });
});
