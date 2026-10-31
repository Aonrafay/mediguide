import Link from "next/link";

import { connection } from "next/server";

import { getAdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";
import { flagEmoji } from "@/lib/slugs";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

// Live per-request data (counts, "today") — blocking route.
export const instant = false;

export default async function AdminDashboardPage() {
  // Dashboard is per-request (live counts + "today") — opt out of prerendering.
  await connection();

  const scope = await getAdminScope();
  if (!scope) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const scoped = scope.type === "COUNTRY";

  const [countries, cities, facilities, doctors, patients, todayAppointments, pendingAppointments] =
    await Promise.all([
      db.country.count({
        ...(scoped ? { where: { id: scope.countryId } } : {}),
      }),
      db.city.count({
        ...(scoped ? { where: { countryId: scope.countryId } } : {}),
      }),
      db.facility.count({
        ...(scoped
          ? { where: { city: { countryId: scope.countryId } } }
          : {}),
      }),
      db.doctor.count({
        ...(scoped
          ? { where: { facility: { city: { countryId: scope.countryId } } } }
          : {}),
      }),
      db.appointment.findMany({
        where: scoped
          ? { facility: { city: { countryId: scope.countryId } } }
          : {},
        select: { patientId: true },
        distinct: ["patientId"],
      }),
      db.appointment.count({
        where: {
          date: { gte: startOfToday },
          ...(scoped
            ? { facility: { city: { countryId: scope.countryId } } }
            : {}),
        },
      }),
      db.appointment.count({
        where: {
          status: "PENDING",
          ...(scoped
            ? { facility: { city: { countryId: scope.countryId } } }
            : {}),
        },
      }),
    ]);

  const stats = [
    { label: "Countries", value: countries, href: "/admin/countries", icon: "🌍", show: !scoped },
    { label: "Cities", value: cities, href: "/admin/cities", icon: "🏙️", show: true },
    { label: "Facilities", value: facilities, href: "/admin/facilities", icon: "🏢", show: true },
    { label: "Doctors", value: doctors, href: "/admin/doctors", icon: "👨‍⚕️", show: true },
    { label: "Patients", value: patients.length, href: "/admin/users", icon: "👥", show: !scoped },
    {
      label: "Today's Appointments",
      value: todayAppointments,
      href: "/admin/appointments",
      icon: "📅",
      show: true,
    },
  ].filter((s) => s.show);

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">
            {scoped ? `${scope.countryName} Control Panel` : "Dashboard"}
          </h1>
          {scoped && (
            <span className="rounded-full bg-teal-600 px-3 py-1 text-sm font-bold text-white">
              {flagEmoji(scope.countryCode)} {scope.countryName}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {scoped
            ? `All cities, facilities, doctors and bookings of ${scope.countryName} — ${formatDate(new Date())}`
            : `Overview of the whole platform — ${formatDate(new Date())}`}
        </p>
      </div>

      {pendingAppointments > 0 && (
        <Link
          href="/admin/appointments?status=PENDING"
          className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
        >
          ⏳ {pendingAppointments} appointment{pendingAppointments === 1 ? "" : "s"} waiting
          for confirmation — review now →
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:shadow-sm"
          >
            <p className="text-2xl">{s.icon}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Getting started */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold">Data flow — how a booking reaches this panel</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every booking is automatically routed to the right country panel through
          its location chain:
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
          {["Patient", "Doctor", "Facility", "City", "Country panel"].map(
            (step, index, arr) => (
              <span key={step} className="flex items-center gap-2">
                <span className="rounded-lg bg-slate-100 px-3 py-2">{step}</span>
                {index < arr.length - 1 && <span className="text-teal-600">→</span>}
              </span>
            )
          )}
        </div>
        {scoped ? (
          <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
            This panel manages <b>{scope.countryName}</b> only. Bookings made in{" "}
            {scope.countryName} appear here automatically; bookings in other
            countries belong to their own panels.
          </p>
        ) : (
          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            As super admin you see every country. Assign country admins in{" "}
            <Link href="/admin/users" className="font-semibold text-teal-700 hover:underline">
              Users
            </Link>{" "}
            to give each country its own focused panel.
          </p>
        )}
      </div>
    </div>
  );
}
