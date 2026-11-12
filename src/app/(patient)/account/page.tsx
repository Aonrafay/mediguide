import Link from "next/link";
import { redirect } from "next/navigation";

import AppointmentRow from "@/components/patient/AppointmentRow";
import { Avatar, Stars } from "@/components/patient/cards";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

export const metadata = { title: "My Appointments" };
export const instant = false;

export default async function AccountPage({
  searchParams,
}: PageProps<"/account">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  if (session.role === "ADMIN") redirect("/admin");

  const { locale, t } = await getI18n();
  const tr = await loadContentTranslator(locale, ["City", "Facility", "Specialty"]);
  const sp = await searchParams;
  const booked = sp.booked === "1";

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
  ]);

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
          <h1 className="text-3xl font-bold text-slate-900">{t("acct.title")}</h1>
          <p className="mt-1 text-slate-500">
            {t("acct.welcome", { name: session.name })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/account/transfer"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {t("acct.transferLink")}
          </Link>
          <Link
            href="/account/history"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {t("acct.histLink")}
          </Link>
          <Link
            href="/account/notifications"
            className="relative rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {t("acct.notifications")}
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
            {t("acct.bookNew")}
          </Link>
        </div>
      </header>

      {booked && (
        <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {t("acct.booked")}
        </p>
      )}

      {/* Upcoming */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">
          {t("acct.upcoming", { n: upcoming.length })}
        </h2>
        <div className="mt-4 space-y-4">
          {upcoming.map((appt) => (
            <AppointmentRow key={appt.id} appt={appt} highlight t={t} tr={tr} />
          ))}
          {upcoming.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              {t("acct.none")}{" "}
              <Link href="/doctors" className="text-teal-700 hover:underline">
                {t("acct.findDoctor")}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Favourites */}
      {favourites.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">
            {t("acct.favTitle", { n: favourites.length })}
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
                    {fav.doctor.specialty.icon}{" "}
                    {tr("Specialty", fav.doctor.specialtyId, "name", fav.doctor.specialty.name)}{" "}
                    ·{" "}
                    {tr("Facility", fav.doctor.facilityId, "name", fav.doctor.facility.name)}
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
          <h2 className="text-xl font-bold text-slate-900">{t("acct.history")}</h2>
          <p className="mt-1 text-sm text-slate-500">
            <Link href="/account/history" className="font-medium text-teal-700 hover:underline">
              {t("hist.viewAll")}
            </Link>
          </p>
          <div className="mt-4 space-y-4">
            {past.map((appt) => (
              <AppointmentRow key={appt.id} appt={appt} t={t} tr={tr} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
