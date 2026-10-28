import Link from "next/link";

import { getI18n } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { CATEGORY_ICONS } from "@/lib/blog";

export const metadata = { title: "Health Blog" };
export const instant = false;

export default async function BlogPage({
  searchParams,
}: PageProps<"/blog">) {
  const { t } = await getI18n();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const category = typeof sp.category === "string" ? sp.category : "";

  const posts = await db.blogPost.findMany({
    where: {
      isPublished: true,
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { excerpt: { contains: q } },
              { content: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ publishedAt: "desc" }],
  });

  // Categories that actually have published posts
  const allPublished = await db.blogPost.findMany({
    where: { isPublished: true },
    select: { category: true },
  });
  const activeCategories = [...new Set(allPublished.map((p) => p.category))];

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <header className="text-center">
        <p className="text-4xl">📰</p>
        <h1 className="mt-3 text-4xl font-bold text-slate-900">{t("blog.title")}</h1>
        <p className="mt-3 text-slate-500">{t("blog.subtitle")}</p>

        <form className="mx-auto mt-6 flex max-w-md gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder={t("blog.searchPlaceholder")}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-teal-400"
          />
          <button
            type="submit"
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            🔍
          </button>
        </form>
      </header>

      {/* Category chips */}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link
          href="/blog"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            !category
              ? "bg-teal-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          {t("blog.allCategories")}
        </Link>
        {activeCategories.map((c) => (
          <Link
            key={c}
            href={`/blog?category=${encodeURIComponent(c)}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              category === c
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {CATEGORY_ICONS[c] ?? "📁"} {c}
          </Link>
        ))}
      </div>

      {/* Posts grid */}
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-teal-300 hover:shadow-md"
          >
            {post.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.coverImage}
                alt={post.title}
                className="h-44 w-full object-cover transition group-hover:opacity-95"
              />
            ) : (
              <div className="flex h-44 items-center justify-center bg-gradient-to-br from-teal-100 to-teal-50 text-5xl">
                {CATEGORY_ICONS[post.category] ?? "📰"}
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              <span className="w-fit rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                {CATEGORY_ICONS[post.category] ?? ""} {post.category}
              </span>
              <h2 className="mt-2 font-bold text-slate-900 group-hover:text-teal-700">
                {post.title}
              </h2>
              <p className="mt-1 line-clamp-3 flex-1 text-sm text-slate-500">
                {post.excerpt}
              </p>
              <p className="mt-3 text-xs text-slate-400">
                {t("blog.by")} {post.authorName} ·{" "}
                {post.publishedAt
                  ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""}
              </p>
              <span className="mt-2 text-sm font-semibold text-teal-700">
                {t("blog.readMore")}
              </span>
            </div>
          </Link>
        ))}
        {posts.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">
            {t("blog.none")}
          </p>
        )}
      </div>
    </main>
  );
}
