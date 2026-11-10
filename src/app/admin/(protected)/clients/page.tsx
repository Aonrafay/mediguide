import Link from "next/link";

import { PageHeader } from "@/components/admin/table";
import { updateClientService } from "@/lib/actions/partner";
import { db } from "@/lib/db";
import { formatFee } from "@/lib/utils";

export const metadata = { title: "Clients" };
export const instant = false;

const PLATFORMS = ["instagram", "linkedin", "x", "facebook", "website"] as const;

export default async function AdminClientsPage() {
  const clients = await db.clientService.findMany({
    orderBy: { startedAt: "desc" },
    include: {
      facility: {
        include: {
          type: true,
          city: { include: { country: true } },
        },
      },
      _count: { select: { posts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Partner Clients"
        subtitle="Facilities with active digital-service engagements — portfolio pages, social media, ads, ordering and more."
      />

      <div className="space-y-4">
        {clients.map((client) => {
          const platforms = JSON.parse(client.platforms) as string[];
          return (
            <div key={client.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {client.facility.type.icon} {client.facility.name}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        client.planTier === "PREMIUM"
                          ? "bg-amber-100 text-amber-700"
                          : client.planTier === "PRO"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {client.planTier}
                    </span>
                    {!client.isActive && (
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {client.facility.city.name}, {client.facility.city.country.name} ·{" "}
                    started {new Date(client.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-teal-700">
                    {formatFee(client.monthlyFee)} / month ·{" "}
                    {client._count.posts} post(s) logged
                  </p>
                </div>

                <div className="flex w-full max-w-xs shrink-0 flex-col gap-3">
                  <a
                    href={`/portfolio/${client.facilityId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-2 text-center text-sm font-semibold text-teal-700 transition hover:bg-teal-100"
                  >
                    🎨 View portfolio ↗
                  </a>
                  <a
                    href={`/admin/social/${client.id}`}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    📱 Social media log
                  </a>
                  <form action={updateClientService} className="space-y-2 rounded-xl bg-slate-50 p-3">
                    <input type="hidden" name="id" value={client.id} />
                    <select
                      name="planTier"
                      defaultValue={client.planTier}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="BASIC">Basic</option>
                      <option value="PRO">Pro</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                    <input
                      name="monthlyFee"
                      type="number"
                      min={0}
                      defaultValue={client.monthlyFee}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <div className="flex flex-wrap gap-2 text-xs">
                      {PLATFORMS.map((platform) => (
                        <label key={platform} className="flex items-center gap-1.5">
                          <input
                            type="checkbox"
                            name="platforms"
                            value={platform}
                            defaultChecked={platforms.includes(platform)}
                            className="h-3.5 w-3.5 rounded border-slate-300 accent-teal-600"
                          />
                          {platform}
                        </label>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                      <input
                        type="checkbox"
                        name="isActive"
                        defaultChecked={client.isActive}
                        className="h-3.5 w-3.5 rounded border-slate-300 accent-teal-600"
                      />
                      Active engagement
                    </label>
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                    >
                      Save engagement
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
        {clients.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-4xl">🤝</p>
            <p className="mt-3 text-slate-500">
              No active clients yet — activate one from{" "}
              <Link href="/admin/requests" className="text-teal-700 hover:underline">
                Service Requests
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
