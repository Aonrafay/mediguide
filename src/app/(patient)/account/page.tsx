import Link from "next/link";
import { redirect } from "next/navigation";

import { Avatar, Stars } from "@/components/patient/cards";
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

  const [appointments, favourites, unreadNotifications] = await Promise.all([
    db.appointment.findMany({
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
    }),
    db.favourite.findMany({
      where: { patientId: session.userId },
      include: {
        doctor: {
          include: {
            specialty: true,
            facility: { include: { city: true } },
          },
        },
      },
    }),
    db.notification.count({ where: { userId: session.userId, isRead: false } }),
  ]) as unknown as [
    AppointmentRow[],
    Array<{
      doctor: {
        id: string;
        name: string;
        rating: number;
        reviewCount: number;
        specialty: { name: string; icon: string | null };
        facility: { name: string; city: { name: string } };
      };
    }>,
    number,
  ];

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
        <div className="flex items-center gap-3">
          <Link
            href="/account/notifications"
            className="relative rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            🔔 Notifications
            {unreadNotifications > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadNotifications}
              </span>
            )}
          </Link>
          <Link
            href="/doctors"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            + Book new appointment
          </Link>
        </div>
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

      {/* Favourites */}
      {favourites.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">
            ❤️ My favourite doctors ({favourites.length})
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {favourites.map((fav) => (
              <Link
                key={fav.doctor.id}
                href={`/doctor/${fav.doctor.id}`}
                className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
              >
                <Avatar name={fav.doctor.name} size="h-11 w-11 text-sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">
                    {fav.doctor.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fav.doctor.specialty.icon} {fav.doctor.specialty.name} ·{" "}
                    {fav.doctor.facility.name}
                  </p>
                </div>
                {fav.doctor.reviewCount > 0 && (
                  <Stars rating={fav.doctor.rating} />
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

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
