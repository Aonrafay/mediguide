import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader, Table } from "@/components/admin/table";
import { SubmitButton } from "@/components/admin/ui";
import { addSocialPost, deleteSocialPost, markPostPosted } from "@/lib/actions/partner";
import { db } from "@/lib/db";

export const metadata = { title: "Social Media" };
export const instant = false;

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "📸 Instagram",
  linkedin: "💼 LinkedIn",
  x: "🐦 X",
  facebook: "📘 Facebook",
  website: "🌐 Website",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200";

export default async function SocialLogPage({
  params,
}: PageProps<"/admin/social/[id]">) {
  const { id } = await params;

  const client = await db.clientService.findUnique({
    where: { id },
    include: {
      facility: {
        include: {
          type: true,
          city: { include: { country: true } },
        },
      },
      posts: { orderBy: [{ status: "asc" }, { scheduledFor: "asc" }, { createdAt: "desc" }] },
    },
  });
  if (!client) notFound();

  const planned = client.posts.filter((p) => p.status === "PLANNED");
  const posted = client.posts.filter((p) => p.status === "POSTED");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Social media — ${client.facility.name}`}
        subtitle={`${client.planTier} plan · what we posted / will post on their platforms`}
      >
        <Link
          href="/admin/clients"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          ← All clients
        </Link>
      </PageHeader>

      {/* Add post */}
      <form action={addSocialPost} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-[180px_1fr_180px_auto] md:items-end">
        <input type="hidden" name="clientServiceId" value={client.id} />
        <div>
          <label className="block text-xs font-medium text-slate-500">Platform</label>
          <select name="platform" className={inputClass} defaultValue="instagram">
            {Object.entries(PLATFORM_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Post content</label>
          <input name="content" required className={inputClass} placeholder="e.g. Free sugar screening camp — this Sunday 9am–2pm 🩺" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Scheduled for</label>
          <input name="scheduledFor" type="date" className={inputClass} />
        </div>
        <SubmitButton label="＋ Add to plan" />
      </form>

      {/* Planned */}
      <section>
        <h2 className="text-lg font-bold text-slate-900">
          🗓️ Planned ({planned.length})
        </h2>
        <div className="mt-3 space-y-3">
          {planned.map((post) => (
            <div key={post.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 font-medium text-teal-700">
                    {PLATFORM_LABELS[post.platform] ?? post.platform}
                  </span>
                  {post.scheduledFor && (
                    <span className="text-xs text-slate-400">
                      📅 {new Date(post.scheduledFor).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-700">{post.content}</p>
              </div>
              <form action={markPostPosted} className="flex items-center gap-2">
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="clientServiceId" value={client.id} />
                <input
                  name="postUrl"
                  placeholder="Post URL after publishing"
                  className="w-52 rounded-lg border border-slate-300 px-3 py-1.5 text-xs"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                >
                  ✔ Mark posted
                </button>
              </form>
              <form action={deleteSocialPost}>
                <input type="hidden" name="id" value={post.id} />
                <input type="hidden" name="clientServiceId" value={client.id} />
                <button
                  type="submit"
                  className="text-xs font-medium text-rose-600 hover:underline"
                >
                  Delete
                </button>
              </form>
            </div>
          ))}
          {planned.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
              Nothing planned — add posts above to keep this client's pages active.
            </p>
          )}
        </div>
      </section>

      {/* Posted */}
      <section>
        <h2 className="text-lg font-bold text-slate-900">
          ✅ Posted ({posted.length})
        </h2>
        <Table head={["Platform", "Content", "Posted", "Link", ""]}>
          {posted.map((post) => (
            <tr key={post.id} className="text-slate-700">
              <td className="px-4 py-3 whitespace-nowrap">
                {PLATFORM_LABELS[post.platform] ?? post.platform}
              </td>
              <td className="max-w-md px-4 py-3 text-sm">{post.content}</td>
              <td className="px-4 py-3 text-xs text-slate-400">
                {post.postedAt
                  ? new Date(post.postedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3">
                {post.postUrl ? (
                  <a
                    href={post.postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-sky-700 hover:underline"
                  >
                    Open ↗
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <form action={deleteSocialPost}>
                  <input type="hidden" name="id" value={post.id} />
                  <input type="hidden" name="clientServiceId" value={client.id} />
                  <button type="submit" className="text-xs font-medium text-rose-600 hover:underline">
                    Delete
                  </button>
                </form>
              </td>
            </tr>
          ))}
          {posted.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                Nothing posted yet.
              </td>
            </tr>
          )}
        </Table>
      </section>
    </div>
  );
}
