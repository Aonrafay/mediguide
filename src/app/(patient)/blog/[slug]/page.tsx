import Link from "next/link";
import { notFound } from "next/navigation";

import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { parseJsonArray } from "@/lib/slugs";

export const instant = false;

type Props = PageProps<"/blog/[slug]">;

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await db.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true },
  });
  return { title: post?.title ?? "Blog", description: post?.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const { t } = await getI18n();

  const post = await db.blogPost.findUnique({
    where: { slug },
  });
  if (!post || !post.isPublished) notFound();

  // Count the view (fire and forget)
  await db.blogPost.update({
    where: { id: post.id },
    data: { views: { increment: 1 } },
  });

  // Related posts in the same category
  const related = await db.blogPost.findMany({
    where: { isPublished: true, category: post.category, id: { not: post.id } },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const tags = parseJsonArray(post.tags);
  const readMinutes = Math.max(1, Math.round(post.content.split(/\s+/).length / 200));

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <nav className="text-sm text-slate-500">
        <Link href="/blog" className="hover:text-teal-700">
          {t("blog.backToBlog")}
        </Link>
      </nav>

      <article className="mt-4">
        <header>
          <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {post.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            {t("blog.by")} <b>{post.authorName}</b>
            {post.publishedAt &&
              ` · ${new Date(post.publishedAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}`}
            {" · "}
            {readMinutes} {t("blog.minRead")}
            {" · "}
            👁️ {post.views} {t("blog.views")}
          </p>
        </header>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="mt-6 max-h-96 w-full rounded-2xl object-cover"
          />
        )}

        {/* Body: blank line = paragraph */}
        <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-700">
          {post.content.split(/\n\s*\n/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-slate-900">{t("blog.related")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
              >
                <p className="font-semibold text-slate-900">{r.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">{r.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-teal-50 p-6 text-center">
        <p className="font-semibold text-slate-900">💬 Need a doctor?</p>
        <p className="mt-1 text-sm text-slate-600">
          Find verified hospitals and clinics in your city — book in-person or by video.
        </p>
        <Link
          href="/doctors"
          className="mt-4 inline-block rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          {t("nav.findDoctors")}
        </Link>
      </div>
    </main>
  );
}
