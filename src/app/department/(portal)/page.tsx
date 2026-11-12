import { ErrorBanner, PageHeader, Table } from "@/components/admin/table";
import { departmentConfirm, departmentReject } from "@/lib/actions/department";
import { respondHistoryTransfer } from "@/lib/actions/transfer";
import { SubmitButton } from "@/components/admin/ui";
import { db } from "@/lib/db";
import {
  APPOINTMENT_MODE_LABELS,
  type AppointmentMode,
} from "@/lib/constants";
import { formatDateUTC } from "@/lib/utils";
import { getI18n } from "@/lib/i18n/server";

export const metadata = { title: "Booking Requests" };
export const instant = false;

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200";

export default async function DepartmentPage({
  searchParams,
}: PageProps<"/department">) {
  const { error } = await searchParams;
  const { t } = await getI18n();

  // The layout guarantees a DEPARTMENT user with a facility; scoped query:
  const session = await import("@/lib/auth").then((m) => m.getSession());
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session!.userId },
    select: { facilityId: true },
  });
  if (!user?.facilityId) return null;

  const requests = await db.appointment.findMany({
    where: { facilityId: user.facilityId, status: "APPROVED" },
    orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    include: {
      patient: { select: { name: true, email: true, phone: true } },
      doctor: { include: { specialty: true } },
    },
  });

  // Incoming patient history-transfer requests (Phase 16)
  const transferRequests = await db.historyTransfer.findMany({
    where: { targetFacilityId: user.facilityId, status: "NEW" },
    orderBy: { createdAt: "desc" },
    include: {
      patient: { select: { name: true, email: true } },
      sourceFacility: true,
      items: {
        include: {
          appointment: {
            include: { doctor: { include: { specialty: true } } },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Booking requests"
        subtitle="Appointments approved by MediGuide admin — confirm the ones your facility can serve."
      />

      <ErrorBanner message={error} />

      <div className="space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-slate-900">
                    {request.patient.name}
                  </p>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    {request.mode === "VIDEO" ? "🎥" : "🏥"}{" "}
                    {APPOINTMENT_MODE_LABELS[request.mode as AppointmentMode]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {request.doctor.specialty.icon}{" "}
                  {request.doctor.specialty.name} · {request.doctor.name}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-800">
                  📅 {formatDateUTC(request.date)} · 🕐 {request.timeSlot}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  ✉️ {request.patient.email}
                  {request.patient.phone && ` · 📞 ${request.patient.phone}`}
                </p>
                {request.notes && (
                  <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
                    📝 Patient note: {request.notes}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-3">
                {/* Confirm */}
                <form action={departmentConfirm} className="space-y-2">
                  <input type="hidden" name="id" value={request.id} />
                  <input
                    name="note"
                    placeholder="Note for the patient (optional)"
                    className={inputClass}
                  />
                  <SubmitButton label="✔ Confirm appointment" />
                </form>

                {/* Reject */}
                <form action={departmentReject} className="space-y-2">
                  <input type="hidden" name="id" value={request.id} />
                  <input
                    name="reason"
                    required
                    placeholder="Reason for rejection (required)"
                    className={inputClass}
                  />
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
                  >
                    ✖ Reject → back to admin
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}

        {requests.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-4xl">🎉</p>
            <p className="mt-3 font-medium text-slate-600">
              No pending requests — all bookings are handled.
            </p>
            <p className="mt-1 text-sm text-slate-400">
              New requests arrive when MediGuide admin approves a booking at your
              facility.
            </p>
          </div>
        )}
      </div>

      {/* Patient history-transfer requests (Phase 16) */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {t("trf.deptRequests", { n: transferRequests.length })}
            </h2>
            <p className="text-sm text-slate-500">{t("trf.deptSub")}</p>
          </div>
          <a
            href="/department/records"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {t("dept.viewRecords")}
          </a>
        </div>

        <div className="mt-4 space-y-4">
          {transferRequests.map((transfer) => (
            <div
              key={transfer.id}
              className="rounded-2xl border border-teal-200 bg-teal-50/40 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {transfer.patient.name}
                    </p>
                    <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-700">
                      📂 {t("trf.recordsCount", { n: transfer.items.length })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {transfer.sourceFacility
                      ? t("trf.deptFrom", {
                          facility: transfer.sourceFacility.name,
                        })
                      : t("trf.deptFromAll")}{" "}
                    · ✉️ {transfer.patient.email}
                  </p>
                  {transfer.note && (
                    <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-600">
                      💬 {transfer.note}
                    </p>
                  )}
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
                    {transfer.items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-100"
                      >
                        {item.appointment.doctor.specialty.icon}{" "}
                        {item.appointment.doctor.specialty.name} ·{" "}
                        {item.appointment.doctor.name} · 📅{" "}
                        {formatDateUTC(item.appointment.date)} · 🕐{" "}
                        {item.appointment.timeSlot}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex w-full max-w-xs shrink-0 flex-col gap-3">
                  <form action={respondHistoryTransfer} className="space-y-2">
                    <input type="hidden" name="id" value={transfer.id} />
                    <input type="hidden" name="decision" value="accept" />
                    <SubmitButton label="✔ Accept & view records" />
                  </form>
                  <form action={respondHistoryTransfer} className="space-y-2">
                    <input type="hidden" name="id" value={transfer.id} />
                    <input type="hidden" name="decision" value="decline" />
                    <input
                      name="reason"
                      required
                      placeholder={t("trf.declineReasonPh")}
                      className={inputClass}
                    />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-white px-4 py-2 text-sm font-semibold text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-50"
                    >
                      ✖ {t("trf.decline")}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
          {transferRequests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-4xl">📭</p>
              <p className="mt-3 text-sm text-slate-400">
                {t("trf.deptEmpty")}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
