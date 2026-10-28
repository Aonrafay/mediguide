"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { slugify } from "@/lib/slugs";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function friendlyError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "P2002") return "A post with this title/slug already exists.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

async function run(path: string, mutate: () => Promise<unknown>) {
  let error: string | undefined;
  const result = await (async () => {
    try {
      return await mutate();
    } catch (caught) {
      return friendlyError(caught);
    }
  })();
  if (typeof result === "string") error = result;
  revalidatePath(path);
  revalidatePath("/blog");
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}

export async function saveBlogPost(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  const title = str(formData, "title");
  const excerpt = str(formData, "excerpt");
  const content = str(formData, "content");
  const category = str(formData, "category") || "General Health";
  const coverImage = str(formData, "coverImage");
  const authorName = str(formData, "authorName") || "MediGuide Team";
  const tags = str(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const isPublished = str(formData, "isPublished") === "on";

  await run("/admin/blog", async () => {
    if (!title || !excerpt || !content)
      return "Title, excerpt and content are required.";

    const baseSlug = slugify(title) || `post-${Date.now()}`;
    let slug = baseSlug;
    let attempt = 1;
    // Ensure slug uniqueness (excluding the edited post itself)
    for (;;) {
      const clash = await db.blogPost.findUnique({ where: { slug } });
      if (!clash || clash.id === id) break;
      slug = `${baseSlug}-${++attempt}`;
    }

    const data = {
      title,
      excerpt,
      content,
      category,
      coverImage: coverImage || null,
      authorName,
      tags: JSON.stringify(tags),
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    };

    if (id) {
      const existing = await db.blogPost.findUnique({ where: { id } });
      await db.blogPost.update({
        where: { id },
        data: {
          ...data,
          slug,
          // Keep original publish date when it stays published
          publishedAt:
            isPublished ? (existing?.publishedAt ?? new Date()) : null,
        },
      });
    } else {
      await db.blogPost.create({ data: { ...data, slug } });
    }
  });
}

export async function deleteBlogPost(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  await run("/admin/blog", () => db.blogPost.delete({ where: { id } }));
}
