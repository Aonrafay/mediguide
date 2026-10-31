import Link from "next/link";
import { connection } from "next/server";

import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  CheckField,
  ErrorBanner,
  Field,
  FieldRow,
  inputClass,
} from "@/components/admin/table";
import { deleteCountry, saveCountry } from "@/lib/actions/admin";
import { selectAdminCountry } from "@/lib/actions/adminContext";
import { getAdminContext } from "@/lib/adminContext";
import { db } from "@/lib/db";
import { flagEmoji } from "@/lib/slugs";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Admin Home" };

// Live per-request data (counts, "today") — blocking route.
export const instant = false;

const GLOBAL_TOOLS = [
  { href: "/admin/requests", icon: "💼", label: "Service Requests", desc: "Clinics asking for portfolio/social" },
  { href: "/admin/clients", icon: "🤝", label: "Partner Clients", desc: "Active social-media engagements" },
  { href: "/admin/facility-types", icon: "🏥", label: "Facility Types", desc: "Hospital, Clinic, Complex, Lab" },
  { href: "/admin/specialties", icon: "🩺", label: "Specialties", desc: "Medical specialties list" },
  { href: "/admin/users", icon: "👥", label: "Users", desc: "Accounts & country admins" },
  { href: "/admin/messages", icon: "📨", label: "Contact Inbox", desc: "Messages from the site" },
  { href: "/admin/blog", icon: "📰", label: "Blog", desc: "Health articles" },
  { href: "/admin/languages", icon: "🌐", label: "Languages", desc: "Enable & default language" },
  { href: "/admin/settings", icon: "⚙️", label: "Settings", desc: "Password & overview" },
];

export default async function AdminHomePage({
  searchParams,
}: PageProps<"/admin">) {
  // Dashboard is per-request (live counts + "today") — opt out of prerendering.
  await connection();

  const ctx = await getAdminContext();
  if (!ctx) return null;

  const { error } = await searchParams;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  /* ================= COUNTRY PANEL MODE ================= */
  if (ctx.mode === "COUNTRY") {
    const scopedWhere = { facility: { city: { countryId: ctx.countryId } } };

    const [cities, facilities, doctors, todayAppointments, pendingAppointments] =
      await Promise.all([
        db.city.count({ where: { countryId: ctx.countryId } }),
        db.facility.count({ where: { city: { countryId: ctx.countryId } } }),
        db.doctor.count({
          where: { facility: { city: { countryId: ctx.countryId } } },
        }),
        db.appointment.count({
          where: { date: { gte: startOfToday }, ...scopedWhere },
        }),
        db.appointment.count({ where: { status: "PENDING", ...scopedWhere } }),
      ]);

    const stats = [
      { label: "Cities", value: cities, href: "/admin/cities", icon: "🏙️" },
      { label: "Facilities", value: facilities, href: "/admin/facilities", icon: "🏢" },
      { label: "Doctors", value: doctors, href: "/admin/doctors", icon: "👨‍⚕️" },
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold">{ctx.countryName} Control Panel</h1>
            <span className="rounded-full bg-teal-600 px-3 py-1 text-sm font-bold text-white">
              {flagEmoji(ctx.countryCode)} {ctx.countryName}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            All cities, facilities, doctors and bookings of {ctx.countryName} —{" "}
            {formatDate(new Date())}
          </p>
        </div>

        {pendingAppointments > 0 && (
          <Link
            href="/admin/appointments?status=PENDING"
            className="block rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition hover:bg-amber-100"
          >
            ⏳ {pendingAppointments} appointment{pendingAppointments === 1 ? "" : "s"}{" "}
            waiting for confirmation — review now →
          </Link>
        )}

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold">Data flow — how a booking reaches this panel</h2>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-700">
            {["Patient", "Doctor", "Facility", "City", "Country panel"].map(
              (step, index, arr) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="rounded-lg bg-slate-100 px-3 py-2">{step}</span>
                  {index < arr.length - 1 && (
                    <span className="text-teal-600">→</span>
                  )}
                </span>
              )
            )}
          </div>
          <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
            This panel manages <b>{ctx.countryName}</b> only. Bookings made in{" "}
            {ctx.countryName} appear here automatically; bookings in other countries
            belong to their own panels.
          </p>
        </div>
      </div>
    );
  }

  /* ================= GLOBAL HOME MODE ================= */

  const [countries, pendingCount, cities, facilities, serviceRequests, activeClients] =
    await Promise.all([
      db.country.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { cities: true } } },
      }),
      db.appointment.count({ where: { status: "PENDING" } }),
      db.city.findMany({ select: { id: true, countryId: true } }),
      db.facility.findMany({
        select: { cityId: true, planTier: true, _count: { select: { doctors: true } } },
      }),
      db.serviceRequest.count({ where: { status: "NEW" } }),
      db.clientService.count({ where: { isActive: true } }),
    ]);

  // Per-country rollups: facilities & doctors counts
  const cityCountry = new Map(cities.map((c) => [c.id, c.countryId]));
  const facilitiesByCountry = new Map<string, number>();
  const doctorsByCountry = new Map<string, number>();
  for (const facility of facilities) {
    const countryId = cityCountry.get(facility.cityId);
    if (!countryId) continue;
    facilitiesByCountry.set(
      countryId,
      (facilitiesByCountry.get(countryId) ?? 0) + 1
    );
    doctorsByCountry.set(
      countryId,
      (doctorsByCountry.get(countryId) ?? 0) + facility._count.doctors
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Administration Home</h1>
        <p className="mt-1 text-sm text-slate-500">
          Super admin — open a country to manage its cities, hospitals, doctors and
          bookings. {formatDate(new Date())}
        </p>
      </div>

      <ErrorBanner message={typeof error === "string" ? error : undefined} />

      {/* Partner services alerts */}
      {serviceRequests > 0 && (
        <Link
          href="/admin/requests"
          className="block rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-medium text-violet-800 transition hover:bg-violet-100"
        >
          💼 {serviceRequests} new partner service request{serviceRequests === 1 ? "" : "s"} —
          review now →
        </Link>
      )}

      {pendingCount > 0 && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          ⏳ {pendingCount} appointment{pendingCount === 1 ? "" : "s"} pending across
          the platform — open the country panel to review.
        </p>
      )}

      {/* Country cards */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Countries</h2>
            <p className="text-sm text-slate-500">
              Click a country to open its control panel
            </p>
          </div>
          <EntityDialog title="Add Country" action={saveCountry} trigger="＋ Add Country">
            <FieldRow>
              <Field label="Country name">
                <input name="name" required className={inputClass} placeholder="Pakistan" />
              </Field>
              <Field label="Country code" hint="2-letter ISO code, e.g. PK">
                <input name="code" required maxLength={2} className={inputClass} placeholder="PK" />
              </Field>
            </FieldRow>
            <FieldRow>
              <Field label="Phone code" hint="Optional, e.g. +92">
                <input name="phoneCode" className={inputClass} placeholder="+92" />
              </Field>
              <CheckField name="isActive" label="Active (visible to patients)" />
            </FieldRow>
          </EntityDialog>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <div
              key={country.id}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
            >
              {/* Whole-card button enters the panel */}
              <form action={selectAdminCountry}>
                <input type="hidden" name="countryId" value={country.id} />
                <button
                  type="submit"
                  className="w-full text-start"
                  title={`Open ${country.name} panel`}
                >
                  <span className="text-4xl">{flagEmoji(country.code)}</span>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {country.name}
                    {!country.isActive && (
                      <span className="ms-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        inactive
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {country._count.cities} cities ·{" "}
                    {facilitiesByCountry.get(country.id) ?? 0} facilities ·{" "}
                    {doctorsByCountry.get(country.id) ?? 0} doctors
                  </p>
                  <span className="mt-2 inline-block text-sm font-semibold text-teal-700">
                    Open panel →
                  </span>
                </button>
              </form>

              {/* Edit / Delete in the corner */}
              <div className="absolute end-3 top-3 flex items-center gap-2">
                <EntityDialog
                  title={`Edit ${country.name}`}
                  action={saveCountry}
                  openLabel="✏️"
                >
                  <input type="hidden" name="id" value={country.id} />
                  <FieldRow>
                    <Field label="Country name">
                      <input name="name" required defaultValue={country.name} className={inputClass} />
                    </Field>
                    <Field label="Country code">
                      <input name="code" required maxLength={2} defaultValue={country.code} className={inputClass} />
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="Phone code">
                      <input name="phoneCode" defaultValue={country.phoneCode ?? ""} className={inputClass} />
                    </Field>
                    <CheckField name="isActive" label="Active" defaultChecked={country.isActive} />
                  </FieldRow>
                </EntityDialog>
                <DeleteButton
                  action={deleteCountry}
                  id={country.id}
                  confirmMessage={`Delete ${country.name} and ALL its cities, facilities and doctors?`}
                />
              </div>
            </div>
          ))}
          {countries.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
              No countries yet — add the first one with ＋ Add Country.
            </p>
          )}
        </div>
      </section>

      {/* Global tools */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">Global tools</h2>
        <p className="text-sm text-slate-500">
          Platform-wide settings — shared by every country
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {GLOBAL_TOOLS.map((tool) => (            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
            >
              <p className="text-3xl">{tool.icon}</p>
              <p className="mt-2 font-bold text-slate-900">{tool.label}</p>
              <p className="text-xs text-slate-500">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
