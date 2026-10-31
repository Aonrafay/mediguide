import { ErrorBanner, PageHeader, Table } from "@/components/admin/table";
import { departmentConfirm, departmentReject } from "@/lib/actions/department";
import { SubmitButton } from "@/components/admin/ui";
import { db } from "@/lib/db";
import {
  APPOINTMENT_MODE_LABELS,
  type AppointmentMode,
} from "@/lib/constants";
import { formatDateUTC } from "@/lib/utils";

export const metadata = { title: "Booking Requests" };
export const instant = false;

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200";

export default async function DepartmentPage({
  searchParams,
}: PageProps<"/department">) {
  const { error } = await searchParams;

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
    </div>
  );
}
