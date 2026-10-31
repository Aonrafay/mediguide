import { PageHeader, Table } from "@/components/admin/table";
import { SubmitButton } from "@/components/admin/ui";
import {
  activateServiceRequest,
  setServiceRequestStatus,
} from "@/lib/actions/partner";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Service Requests" };
export const instant = false;

const STATUS_BADGES: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-700",
  CONTACTED: "bg-sky-100 text-sky-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

export default async function AdminRequestsPage({
  searchParams,
}: PageProps<"/admin/requests">) {
  const { error } = await searchParams;
  const requests = await db.serviceRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      package: { select: { name: true, tier: true, priceLabel: true } },
      facility: { select: { id: true, name: true } },
      clientService: { select: { id: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Service Requests"
        subtitle="Partnership requests from clinics, hospitals and doctors (the /services form). Activate to start managing their social media."
      />

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {typeof error === "string" ? decodeURIComponent(error) : undefined}
        </p>
      )}

      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900">{request.businessName}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_BADGES[request.status] ?? "bg-slate-100"
                    }`}
                  >
                    {request.status}
                  </span>
                  {request.package && (
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-medium text-teal-700">
                      wants: {request.package.name}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {request.contactPerson} · ✉️ {request.email}
                  {request.phone && ` · 📞 ${request.phone}`}
                </p>
                {request.message && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    💬 {request.message}
                  </p>
                )}
                {request.facility && (
                  <p className="mt-2 text-xs text-slate-400">
                    Linked facility: {request.facility.name}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {formatDate(request.createdAt)}
                </p>
              </div>

              <div className="flex w-full max-w-xs shrink-0 flex-col gap-3">
                {request.status === "NEW" && (
                  <form action={setServiceRequestStatus}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="CONTACTED" />
                    <button
                      type="submit"
                      className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-50"
                    >
                      ✆ Mark contacted
                    </button>
                  </form>
                )}
                {(request.status === "NEW" || request.status === "CONTACTED") && (
                  <form action={activateServiceRequest} className="space-y-2 rounded-xl bg-teal-50 p-3">
                    <input type="hidden" name="id" value={request.id} />
                    <p className="text-xs font-semibold text-teal-800">
                      Activate as client
                    </p>
                    <select
                      name="planTier"
                      defaultValue={request.package?.tier ?? "BASIC"}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="BASIC">Basic — portfolio page</option>
                      <option value="PRO">Pro — page + social setup</option>
                      <option value="PREMIUM">Premium — monthly handling</option>
                    </select>
                    <input
                      name="monthlyFee"
                      type="number"
                      min={0}
                      placeholder="Monthly fee (e.g. 15000)"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    <SubmitButton label="🚀 Activate & create portfolio" />
                  </form>
                )}
                {request.status !== "ACTIVE" && request.status !== "REJECTED" && (
                  <form action={setServiceRequestStatus}>
                    <input type="hidden" name="id" value={request.id} />
                    <input type="hidden" name="status" value="REJECTED" />
                    <button
                      type="submit"
                      className="w-full text-xs font-medium text-rose-600 hover:underline"
                    >
                      Reject request
                    </button>
                  </form>
                )}
                {request.status === "ACTIVE" && request.clientService && (
                  <a
                    href={`/admin/social/${request.clientService.id}`}
                    className="rounded-lg bg-teal-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    📱 Manage social media
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-4xl">📭</p>
            <p className="mt-3 text-slate-500">
              No service requests yet — they arrive from the{" "}
              <a href="/services" className="text-teal-700 hover:underline">
                For Clinics
              </a>{" "}
              page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
