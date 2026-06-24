import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Card, Badge } from "@/components/ui/card";
import { CoverImage } from "@/components/content/cover-image";
import { getBlogPosts } from "@/content/repository";
import { formatDateLong, isoDate } from "@/lib/date";
import { AdminListingNotice } from "@/components/admin/admin-listing-notice";

// Rendered per request (dynamic-content-listings): reads S3 live so a
// publish/edit/hide/delete shows on the next request, with no CDN-cache lag.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog",
  description: "Verhalen, nieuws en updates uit de buurt.",
};

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <Container className="py-14">
      <AdminListingNotice />
      <Badge tone="terracotta">Blog</Badge>
      <h1 className="mt-4 text-4xl sm:text-5xl">Uit de buurt</h1>
      <p className="mt-3 max-w-xl text-lg text-muted">
        Verhalen, nieuws en updates van bewoners en organisatoren.
      </p>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted">Er zijn nog geen blogposts.</p>
      ) : (
        <div className="mt-10 grid gap-6">
          {posts.map((post) => (
            <Card key={post.slug} as="article" className="overflow-hidden">
              <CoverImage src={post.featuredImage} alt={post.title} className="h-56" />
              <div className="p-6">
                <p className="text-sm text-muted">
                  <time dateTime={isoDate(post.date)}>
                    {formatDateLong(post.date)}
                  </time>{" "}
                  · {post.author}
                </p>
                <h2 className="mt-2 text-2xl">
                  <Link href={post.href} className="hover:text-terracotta-strong">
                    {post.title}
                  </Link>
                </h2>
                {post.excerpt ? (
                  <p className="mt-2 text-muted">{post.excerpt}</p>
                ) : null}
                <p className="mt-3">
                  <Link
                    href={post.href}
                    className="text-sm font-medium text-terracotta-strong hover:underline"
                  >
                    Lees verder →
                  </Link>
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
}
