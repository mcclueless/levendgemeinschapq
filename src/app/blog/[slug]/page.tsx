import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Mdx } from "@/components/mdx/mdx";
import { CoverImage } from "@/components/content/cover-image";
import { RelatedInfo } from "@/components/content/related-info";
import { getBlogPost, getBlogPosts } from "@/content/repository";
import { formatDateLong, isoDate } from "@/lib/date";
import { pageMetadata } from "@/lib/metadata";
import { blogPostingJsonLd } from "@/lib/structured-data";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 600;

export async function generateStaticParams() {
  return (await getBlogPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return {};
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: post.href,
    type: "article",
    images: post.featuredImage ? [post.featuredImage] : undefined,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) notFound();

  return (
    <Container className="py-14">
      <JsonLd data={blogPostingJsonLd(post)} />
      <article className="mx-auto max-w-3xl">
        <p className="text-sm text-muted">
          <time dateTime={isoDate(post.date)}>{formatDateLong(post.date)}</time>{" "}
          · {post.author}
        </p>
        <h1 className="mt-2 text-4xl sm:text-5xl">{post.title}</h1>
        <CoverImage
          src={post.featuredImage}
          alt={post.title}
          className="mt-8 aspect-[2/1] rounded-xl"
        />
        <div className="mt-8">
          <Mdx source={post.body} />
        </div>

        <RelatedInfo
          venues={post.relatedVenues}
          organisers={post.relatedOrganisers}
        />
      </article>
    </Container>
  );
}
