import Link from "next/link";
import { redirect } from "next/navigation";

import { Stars } from "@/components/patient/cards";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { cancelAppointment } from "@/lib/actions/booking";
import {
  APPOINTMENT_MODE_LABELS,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentMode,
  type AppointmentStatus,
} from "@/lib/constants";
import { formatDateUTC, statusColors } from "@/lib/utils";

export const metadata = { title: "My Appointments" };
export const instant = false;

type AppointmentRow = {
  id: string;
  date: Date;
  timeSlot: string;
  mode: string;
  status: string;
  notes: string | null;
  meetingLink: string | null;
  doctorId: string;
  doctor: {
    name: string;
    specialty: { name: string; icon: string | null };
    facility: { name: string; city: { name: string } };
  };
};

export default async function AccountPage({
  searchParams,
}: PageProps<"/account">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  if (session.role === "ADMIN") redirect("/admin");

  const { booked } = await searchParams;

  const appointments = (await db.appointment.findMany({
    where: { patientId: session.userId },
    orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
    include: {
      doctor: {
        include: {
          specialty: true,
          facility: { include: { city: true } },
        },
      },
    },
  })) as AppointmentRow[];

  // "Today" starts at UTC midnight — appointments today stay Upcoming all day
  const now = new Date();
  const startOfTodayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const upcoming = appointments.filter(
    (a) =>
      a.date >= startOfTodayUtc &&
      (a.status === "PENDING" || a.status === "CONFIRMED")
  );
  const past = appointments.filter((a) => !upcoming.includes(a));

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
          <p className="mt-1 text-slate-500">Welcome back, {session.name}</p>
        </div>
        <Link
          href="/doctors"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          + Book new appointment
        </Link>
      </header>

      {booked === "1" && (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          🎉 Appointment booked! You&apos;ll see it under <b>Upcoming</b> below.
          The clinic confirms shortly — video appointments show a{" "}
          <b>🎥 Join Call</b> button once confirmed.
        </p>
      )}

      {/* Upcoming */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">
          Upcoming ({upcoming.length})
        </h2>
        <div className="mt-4 space-y-4">
          {upcoming.map((appt) => (
            <AppointmentRow key={appt.id} appt={appt} highlight />
          ))}
          {upcoming.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              No upcoming appointments —{" "}
              <Link href="/doctors" className="text-teal-700 hover:underline">
                find a doctor
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* History */}
      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">History</h2>
          <div className="mt-4 space-y-4">
            {past.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

/* ------------------------------ row component ----------------------------- */

function AppointmentRow({
  appt,
  highlight = false,
}: {
  appt: AppointmentRow;
  highlight?: boolean;
}) {
  const isVideo = appt.mode === "VIDEO";
  const canCancel = appt.status === "PENDING" || appt.status === "CONFIRMED";
  const canJoin = isVideo && appt.status === "CONFIRMED" && appt.meetingLink;

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
            {appt.doctor.specialty.icon} {appt.doctor.specialty.name} ·{" "}
            {appt.doctor.facility.name}, {appt.doctor.facility.city.name}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">
            📅 {formatDateUTC(appt.date)} · 🕐 {appt.timeSlot}
          </p>
          {appt.notes && (
            <p className="mt-1 text-xs text-slate-400">📝 {appt.notes}</p>
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
              🎥 Join Call
            </a>
          )}
          {isVideo && appt.status === "PENDING" && (
            <p className="text-xs text-slate-400">
              Join button activates once the clinic confirms.
            </p>
          )}
          {canCancel && (
            <form action={cancelAppointment}>
              <input type="hidden" name="id" value={appt.id} />
              <button
                type="submit"
                className="text-sm font-medium text-rose-600 hover:underline"
              >
                Cancel appointment
              </button>
            </form>
          )}
          <Link
            href={`/doctor/${appt.doctorId}`}
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            View doctor
          </Link>
        </div>
      </div>
    </div>
  );
}
