import { PageHeader, Table } from "@/components/admin/table";
import { db } from "@/lib/db";
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentMode,
  type AppointmentStatus,
} from "@/lib/constants";
import { formatDateUTC, statusColors } from "@/lib/utils";

export const metadata = { title: "Decisions History" };
export const instant = false;

export default async function DepartmentHistoryPage() {
  const session = await import("@/lib/auth").then((m) => m.getSession());
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session!.userId },
    select: { facilityId: true },
  });
  if (!user?.facilityId) return null;

  const appointments = await db.appointment.findMany({
    where: {
      facilityId: user.facilityId,
      status: { in: ["CONFIRMED", "COMPLETED", "RETURNED", "CANCELLED", "APPROVED"] },
      departmentDecidedAt: { not: null },
    },
    orderBy: { departmentDecidedAt: "desc" },
    include: {
      patient: { select: { name: true } },
      doctor: { include: { specialty: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Decisions history"
        subtitle="Every booking your facility confirmed or returned, most recent first."
      />

      <Table head={["Patient", "Doctor", "When", "Mode", "Status", "Note", "Decided"]}>
        {appointments.map((appt) => (
          <tr key={appt.id} className="text-slate-700">
            <td className="px-4 py-3 font-medium text-slate-900">
              {appt.patient.name}
            </td>
            <td className="px-4 py-3">
              <p>{appt.doctor.name}</p>
              <p className="text-xs text-slate-400">{appt.doctor.specialty.name}</p>
            </td>
            <td className="px-4 py-3">
              {formatDateUTC(appt.date)}{" "}
              <span className="text-xs text-slate-400">· {appt.timeSlot}</span>
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
            <td className="max-w-xs px-4 py-3 text-xs text-slate-500">
              {appt.departmentNote ?? "—"}
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">
              {appt.departmentDecidedAt
                ? new Date(appt.departmentDecidedAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </td>
          </tr>
        ))}
        {appointments.length === 0 && (
          <tr>
            <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
              No decisions yet.
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
}
