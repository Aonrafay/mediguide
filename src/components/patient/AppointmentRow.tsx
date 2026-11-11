import Link from "next/link";

import { cancelAppointment } from "@/lib/actions/booking";
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentMode,
  type AppointmentStatus,
} from "@/lib/constants";
import { formatDateUTC, statusColors } from "@/lib/utils";

export type AppointmentRowData = {
  id: string;
  date: Date;
  timeSlot: string;
  mode: string;
  status: string;
  notes: string | null;
  meetingLink: string | null;
  departmentNote: string | null;
  doctorId: string;
  doctor: {
    name: string;
    specialty: { id: string; name: string; icon: string | null };
    facility: {
      id: string;
      name: string;
      city: { id: string; name: string };
    };
  };
};

type Translator = (
  key: string,
  vars?: Record<string, string | number>
) => string;
type ContentTranslator = (
  entityType: string,
  entityId: string,
  field: string,
  fallback: string
) => string;

/**
 * Rich appointment card shared by the patient dashboard (/account) and the
 * full history page (/account/history). Server component — renders the status
 * badge, approval-chain timeline, notes, Join Call link and cancel form.
 */
export default function AppointmentRow({
  appt,
  highlight = false,
  t,
  tr,
}: {
  appt: AppointmentRowData;
  highlight?: boolean;
  t: Translator;
  tr: ContentTranslator;
}) {
  const isVideo = appt.mode === "VIDEO";
  const canCancel =
    appt.status === "PENDING" ||
    appt.status === "APPROVED" ||
    appt.status === "RETURNED";
  const canJoin = isVideo && appt.status === "CONFIRMED" && appt.meetingLink;

  // Approval-chain progress steps
  const steps = [
    { label: "Booked", done: true },
    { label: "Approved", done: appt.status !== "PENDING" },
    {
      label: "At Facility",
      done: ["CONFIRMED", "COMPLETED"].includes(appt.status),
    },
    {
      label: isVideo ? "Link Active" : "Confirmed",
      done: ["CONFIRMED", "COMPLETED"].includes(appt.status),
    },
    { label: "Completed", done: appt.status === "COMPLETED" },
  ];

  return (
    <div
      className={`rounded-2xl border bg-white p-5 ${
        highlight ? "border-teal-300 shadow-sm" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-900">{appt.doctor.name}</p>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                statusColors[appt.status] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus]}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
              {isVideo ? "🎥" : "🏥"}{" "}
              {APPOINTMENT_MODE_LABELS[appt.mode as AppointmentMode]}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {appt.doctor.specialty.icon}{" "}
            {tr("Specialty", appt.doctor.specialty.id, "name", appt.doctor.specialty.name)}{" "}
            ·{" "}
            {tr("Facility", appt.doctor.facility.id, "name", appt.doctor.facility.name)},{" "}
            {tr("City", appt.doctor.facility.city.id, "name", appt.doctor.facility.city.name)}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            📅 {formatDateUTC(appt.date)} · 🕐 {appt.timeSlot}
          </p>
          {appt.notes && (
            <p className="mt-1 text-xs text-slate-400">📝 {appt.notes}</p>
          )}

          {/* Approval-chain timeline */}
          {appt.status !== "CANCELLED" && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[11px]">
              {steps.map((step, index) => (
                <span key={step.label} className="flex items-center gap-1.5">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      step.done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {step.done ? "✔" : "○"} {step.label}
                  </span>
                  {index < steps.length - 1 && (
                    <span className="text-slate-300">→</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {appt.status === "RETURNED" && appt.departmentNote && (
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-xs text-rose-700">
              ↩️ Facility note: {appt.departmentNote} — MediGuide is arranging an
              alternative.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {canJoin && (
            <a
              href={appt.meetingLink!}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              {t("acct.joinCall")}
            </a>
          )}
          {isVideo && (appt.status === "PENDING" || appt.status === "APPROVED") && (
            <p className="text-xs text-slate-400">{t("acct.joinHint")}</p>
          )}
          {canCancel && (
            <form action={cancelAppointment}>
              <input type="hidden" name="id" value={appt.id} />
              <button
                type="submit"
                className="text-sm font-medium text-rose-600 hover:underline"
              >
                {t("acct.cancel")}
              </button>
            </form>
          )}
          <Link
            href={`/doctor/${appt.doctorId}`}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            {t("acct.viewDoctor")}
          </Link>
        </div>
      </div>
    </div>
  );
}
