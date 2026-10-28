import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  CheckField,
  ErrorBanner,
  Field,
  FieldRow,
  PageHeader,
  Table,
  inputClass,
} from "@/components/admin/table";
import { BLOG_CATEGORIES } from "@/lib/blog";
import { deleteBlogPost, saveBlogPost } from "@/lib/actions/blogAdmin";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Blog" };
export const instant = false;

function postFormFields(post?: {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string | null;
  authorName: string;
  tags: string;
  isPublished: boolean;
}) {
  let tagsValue = "";
  if (post) {
    try {
      tagsValue = (JSON.parse(post.tags) as string[]).join(", ");
    } catch {
      tagsValue = "";
    }
  }
  return (
    <>
      {post && <input type="hidden" name="id" value={post.id} />}
      <Field label="Title">
        <input name="title" required defaultValue={post?.title} className={inputClass} />
      </Field>
      <Field label="Excerpt" hint="Short summary shown on cards and previews">
        <textarea
          name="excerpt"
          rows={2}
          required
          defaultValue={post?.excerpt}
          className={inputClass}
        />
      </Field>
      <Field label="Content" hint="Plain text — a blank line starts a new paragraph">
        <textarea
          name="content"
          rows={10}
          required
          defaultValue={post?.content}
          className={inputClass}
        />
      </Field>
      <FieldRow>
        <Field label="Category">
          <select name="category" defaultValue={post?.category} className={inputClass}>
            {BLOG_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Author name">
          <input
            name="authorName"
            defaultValue={post?.authorName ?? "MediGuide Team"}
            className={inputClass}
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Cover image URL" hint="Optional">
          <input name="coverImage" defaultValue={post?.coverImage ?? ""} className={inputClass} />
        </Field>
        <Field label="Tags" hint="Comma-separated">
          <input name="tags" defaultValue={tagsValue} className={inputClass} />
        </Field>
      </FieldRow>
      <CheckField
        name="isPublished"
        label="Published (visible on the public blog)"
        defaultChecked={post?.isPublished ?? false}
      />
    </>
  );
}

export default async function AdminBlogPage({
  searchParams,
}: PageProps<"/admin/blog">) {
  const { error } = await searchParams;
  const posts = await db.blogPost.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog"
        subtitle="Health articles shown on the public /blog page. Draft posts stay hidden until published."
      >
        <EntityDialog title="New Blog Post" action={saveBlogPost} trigger="＋ New Post" wide>
          {postFormFields()}
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      <Table
        head={["Post", "Category", "Status", "Views", "Date", "Actions"]}
      >
        {posts.map((post) => (
          <tr key={post.id} className="text-slate-700">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{post.title}</p>
              <p className="text-xs text-slate-400">
                by {post.authorName} · /blog/{post.slug}
              </p>
            </td>
            <td className="px-4 py-3">{post.category}</td>
            <td className="px-4 py-3">
              {post.isPublished ? (
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                  Published
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Draft
                </span>
              )}
            </td>
            <td className="px-4 py-3">👁️ {post.views}</td>
            <td className="px-4 py-3 text-xs">
              {post.publishedAt ? formatDate(post.publishedAt) : "—"}
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <EntityDialog
                  title={`Edit — ${post.title}`}
                  action={saveBlogPost}
                  openLabel="Edit"
                  wide
                >
                  {postFormFields(post)}
                </EntityDialog>
                <DeleteButton
                  action={deleteBlogPost}
                  id={post.id}
                  confirmMessage={`Delete “${post.title}”?`}
                />
              </div>
            </td>
          </tr>
        ))}
        {posts.length === 0 && (
          <tr>
            <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
              No posts yet — write your first health article!
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
}
