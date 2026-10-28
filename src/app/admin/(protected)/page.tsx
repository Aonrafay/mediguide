import Link from "next/link";
import { connection } from "next/server";

import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Dashboard" };

// Live per-request data (counts, "today") — blocking route.
export const instant = false;

export default async function AdminDashboardPage() {
  // Dashboard is per-request (live counts + "today") — opt out of prerendering.
  await connection();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [countries, cities, facilities, doctors, patients, todayAppointments] =
    await Promise.all([
      db.country.count(),
      db.city.count(),
      db.facility.count(),
      db.doctor.count(),
      db.user.count({ where: { role: "PATIENT" } }),
      db.appointment.count({ where: { date: { gte: startOfToday } } }),
    ]);

  const stats = [
    { label: "Countries", value: countries, href: "/admin/countries", icon: "🌍" },
    { label: "Cities", value: cities, href: "/admin/cities", icon: "🏙️" },
    { label: "Facilities", value: facilities, href: "/admin/facilities", icon: "🏢" },
    { label: "Doctors", value: doctors, href: "/admin/doctors", icon: "👨‍⚕️" },
    { label: "Patients", value: patients, href: "/admin/users", icon: "👥" },
    {
      label: "Today's Appointments",
      value: todayAppointments,
      href: "/admin/appointments",
      icon: "📅",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Overview of MediGuide data — {formatDate(new Date())}
        </p>
      </div>

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
        <h2 className="font-semibold">Getting started</h2>
        <p className="mt-1 text-sm text-slate-600">
          Build your data in this order — each step needs the previous one:
        </p>
        <ol className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <li className="rounded-lg bg-slate-50 px-3 py-2">1. 🌍 Add countries</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">2. 🏙️ Add cities</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">3. 🏥 Set facility types</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">4. 🏢 Add facilities</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">5. 🩺 Add specialties</li>
          <li className="rounded-lg bg-slate-50 px-3 py-2">6. 👨‍⚕️ Add doctors</li>
        </ol>
      </div>
    </div>
  );
}
