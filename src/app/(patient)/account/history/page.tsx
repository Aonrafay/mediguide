import Link from "next/link";
import { redirect } from "next/navigation";

import AppointmentRow from "@/components/patient/AppointmentRow";
import { Avatar, Stars } from "@/components/patient/cards";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

export const metadata = { title: "My History" };
export const instant = false;

const FILTERS = ["ALL", "UPCOMING", "COMPLETED", "CANCELLED", "RETURNED"] as const;

const FILTER_KEY: Record<string, string> = {
  ALL: "hist.filterAll",
  UPCOMING: "hist.filterUpcoming",
  COMPLETED: "hist.filterCompleted",
  CANCELLED: "hist.filterCancelled",
  RETURNED: "hist.filterReturned",
};

/** "Today" starts at UTC midnight — appointments today stay Upcoming all day. */
function isUpcoming(date: Date, status: string, startOfTodayUtc: Date) {
  return (
    date >= startOfTodayUtc && (status === "PENDING" || status === "CONFIRMED")
  );
}

export default async function HistoryPage({
  searchParams,
}: PageProps<"/account/history">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/history");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "DEPARTMENT") redirect("/department");

  const { locale, t } = await getI18n();
  const tr = await loadContentTranslator(locale, ["City", "Facility", "Specialty"]);

  const sp = await searchParams;
  const raw = typeof sp.status === "string" ? sp.status.toUpperCase() : "ALL";
  const active = ((FILTERS as readonly string[]).includes(raw) ? raw : "ALL") as
    | "ALL"
    | "UPCOMING"
    | "COMPLETED"
    | "CANCELLED"
    | "RETURNED";

  const [appointments, reviews, favourites, notifications] = await Promise.all([
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
    db.review.findMany({
      where: { patientId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        doctor: { include: { specialty: true } },
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
    db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const now = new Date();
  const startOfTodayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const counts = {
    total: appointments.length,
    upcoming: appointments.filter((a) => isUpcoming(a.date, a.status, startOfTodayUtc)).length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
    cancelled: appointments.filter((a) => a.status === "CANCELLED").length,
    reviews: reviews.length,
    favourites: favourites.length,
  };

  const filtered = appointments.filter((a) => {
    if (active === "ALL") return true;
    if (active === "UPCOMING") return isUpcoming(a.date, a.status, startOfTodayUtc);
    return a.status === active;
  });

  const statCards = [
    { icon: "📅", label: t("hist.total"), value: counts.total },
    { icon: "⏳", label: t("hist.upcoming"), value: counts.upcoming },
    { icon: "✅", label: t("hist.completed"), value: counts.completed },
    { icon: "🚫", label: t("hist.cancelled"), value: counts.cancelled },
    { icon: "⭐", label: t("hist.reviews"), value: counts.reviews },
    { icon: "❤️", label: t("hist.favourites"), value: counts.favourites },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/account" className="hover:text-teal-700">
          {t("notif.back")}
        </Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">{t("hist.title")}</h1>
        <p className="mt-1 text-slate-500">{t("hist.sub", { name: session.name })}</p>
      </header>

      {/* Summary counters */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-center"
          >
            <p className="text-xl">{s.icon}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Appointment record + status filters */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900">
          {t("hist.apptsTitle", { n: appointments.length })}
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f}
              href={f === "ALL" ? "/account/history" : `/account/history?status=${f}`}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active === f
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-teal-700"
              }`}
            >
              {t(FILTER_KEY[f])}
            </Link>
          ))}
        </div>

        <div className="mt-5 space-y-4">
          {filtered.map((appt, index) => (
            <AppointmentRow
              key={appt.id}
              appt={appt}
              highlight={active === "ALL" && index === 0}
              t={t}
              tr={tr}
            />
          ))}
          {filtered.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              {t("hist.apptsEmpty")}{" "}
              <Link href="/doctors" className="text-teal-700 hover:underline">
                {t("acct.findDoctor")}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* My reviews */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">
          {t("hist.reviewsTitle", { n: reviews.length })}
        </h2>
        <div className="mt-4 space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link
                  href={`/doctor/${review.doctorId}`}
                  className="flex items-center gap-3 font-semibold text-slate-900 hover:text-teal-700"
                >
                  <Avatar name={review.doctor.name} size="h-9 w-9 text-xs" />
                  {review.doctor.name}
                </Link>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      review.isApproved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {review.isApproved ? t("hist.approved") : t("hist.pending")}
                  </span>
                  <Stars rating={review.rating} />
                </div>
              </div>
              {review.comment && (
                <p className="mt-2 text-sm text-slate-600">“{review.comment}”</p>
              )}
              <p className="mt-2 text-xs text-slate-400">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
          {reviews.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              {t("hist.reviewsEmpty")}
            </p>
          )}
        </div>
      </section>

      {/* Favourite doctors */}
      <section className="mt-12">
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
              {fav.doctor.reviewCount > 0 && <Stars rating={fav.doctor.rating} />}
            </Link>
          ))}
          {favourites.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400 sm:col-span-2">
              {t("hist.favsEmpty")}
            </p>
          )}
        </div>
      </section>

      {/* Recent notifications */}
      <section className="mt-12">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            {t("hist.notifsTitle")}
          </h2>
          <Link
            href="/account/notifications"
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            {t("hist.viewAllNotifs")}
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-2xl border p-4 ${
                n.isRead ? "border-slate-200 bg-white" : "border-teal-200 bg-teal-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="font-semibold text-slate-900">{n.title}</p>
                {!n.isRead && (
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">{n.message}</p>
              <p className="mt-2 text-xs text-slate-400">
                {new Date(n.createdAt).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              {t("hist.notifsEmpty")}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
