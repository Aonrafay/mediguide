import Link from "next/link";

import { ErrorBanner, PageHeader, Table } from "@/components/admin/table";
import { updateAppointmentStatus } from "@/lib/actions/booking";
import { appointmentWhere, type AdminScope } from "@/lib/adminScope";
import { requireCountryView } from "@/lib/adminContext";
import { db } from "@/lib/db";
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentMode,
  type AppointmentStatus,
} from "@/lib/constants";
import { formatDateUTC, statusColors } from "@/lib/utils";

export const metadata = { title: "Appointments" };
export const instant = false;

const FILTERS = ["ALL", ...APPOINTMENT_STATUSES] as const;

export default async function AdminAppointmentsPage({
  searchParams,
}: PageProps<"/admin/appointments">) {
  // Drill-down: requires an open country panel
  const ctx = await requireCountryView();
  const scope: AdminScope = {
    type: "COUNTRY",
    countryId: ctx.countryId,
    countryName: ctx.countryName,
    countryCode: ctx.countryCode,
  };

  const { error, status } = await searchParams;
  const statusFilter =
    typeof status === "string" &&
    FILTERS.includes(status as (typeof FILTERS)[number])
      ? status
      : "ALL";

  const appointments = await db.appointment.findMany({
    where: {
      ...appointmentWhere(scope),
      ...(statusFilter === "ALL" ? {} : { status: statusFilter }),
    },
    orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
    include: {
      patient: { select: { name: true, email: true } },
      doctor: { include: { specialty: true } },
      facility: { select: { name: true, city: { select: { name: true, country: { select: { name: true, code: true } } } } } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        subtitle={`Approval chain: patient books → you approve → facility confirms. RETURNED bookings need re-approval or cancellation.`}
      />

      <ErrorBanner message={error} />

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "ALL" ? "/admin/appointments" : `/admin/appointments?status=${f}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              statusFilter === f
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {f === "ALL" ? "All" : APPOINTMENT_STATUS_LABELS[f]}
          </Link>
        ))}
      </div>

      <Table
        head={["Patient", "Doctor", "When", "Mode", "Status", "Video", "Actions"]}
      >
        {appointments.map((appt) => (
          <tr key={appt.id} className="text-slate-700">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{appt.patient.name}</p>
              <p className="text-xs text-slate-400">{appt.patient.email}</p>
            </td>
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{appt.doctor.name}</p>
              <p className="text-xs text-slate-400">
                {appt.doctor.specialty.name} · {appt.facility.name}
              </p>
            </td>
            <td className="px-4 py-3">
              {formatDateUTC(appt.date)}
              <span className="text-xs text-slate-400"> · {appt.timeSlot}</span>
            </td>
            <td className="px-4 py-3">
              {appt.mode === "VIDEO" ? "🎥" : "🏥"}{" "}
              {APPOINTMENT_MODE_LABELS[appt.mode as AppointmentMode]}
            </td>
            <td className="px-4 py-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusColors[appt.status] ?? "bg-slate-100 text-slate-600"
                }`}
              >
                {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
              </span>
            </td>
            <td className="px-4 py-3">
              {appt.meetingLink ? (
                <a
                  href={appt.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-sky-700 hover:underline"
                >
                  Join link ↗
                </a>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {appt.status === "PENDING" && (
                  <StatusButton id={appt.id} action="approve" label="✔ Approve & Send" green />
                )}
                {appt.status === "APPROVED" && (
                  <span className="rounded-lg bg-violet-50 px-2.5 py-1 font-medium text-violet-700 ring-1 ring-violet-200">
                    ⏳ Awaiting department
                  </span>
                )}
                {appt.status === "CONFIRMED" && (
                  <StatusButton id={appt.id} action="complete" label="Complete" blue />
                )}
                {appt.status === "RETURNED" && (
                  <>
                    <span className="w-full rounded-lg bg-rose-50 px-2.5 py-1 font-medium text-rose-700">
                      ↩️ {appt.departmentNote ?? "Returned by department"}
                    </span>
                    <StatusButton id={appt.id} action="approve" label="Re-approve & Resend" green />
                  </>
                )}
                {(appt.status === "PENDING" ||
                  appt.status === "APPROVED" ||
                  appt.status === "RETURNED" ||
                  appt.status === "CONFIRMED") && (
                  <StatusButton id={appt.id} action="cancel" label="Cancel" red />
                )}
                {(appt.status === "COMPLETED" || appt.status === "CANCELLED") && (
                  <span className="text-slate-400">No actions</span>
                )}
              </div>
            </td>
          </tr>
        ))}
        {appointments.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
              No appointments {statusFilter === "ALL" ? "yet" : "with this status"}.
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
}

function StatusButton({
  id,
  action,
  label,
  green = false,
  red = false,
  blue = false,
}: {
  id: string;
  action: string;
  label: string;
  green?: boolean;
  red?: boolean;
  blue?: boolean;
}) {
  const color = green
    ? "text-emerald-700 ring-emerald-200 hover:bg-emerald-50"
    : red
      ? "text-rose-700 ring-rose-200 hover:bg-rose-50"
      : blue
        ? "text-sky-700 ring-sky-200 hover:bg-sky-50"
        : "text-slate-700 ring-slate-200 hover:bg-slate-50";
  return (
    <form action={updateAppointmentStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button
        type="submit"
        className={`rounded-lg px-2.5 py-1 font-medium ring-1 transition ${color}`}
      >
        {label}
      </button>
    </form>
  );
}
