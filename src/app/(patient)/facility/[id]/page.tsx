import Link from "next/link";
import { notFound } from "next/navigation";

import { DoctorCard } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { flagEmoji, parseJsonArray, slugify } from "@/lib/slugs";

export const instant = false;

type Props = PageProps<"/facility/[id]">;

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const facility = await db.facility.findUnique({
    where: { id },
    select: { name: true },
  });
  return { title: facility?.name ?? "Facility" };
}

export default async function FacilityPage({ params }: Props) {
  const { id } = await params;
  const facility = await db.facility.findUnique({
    where: { id },
    include: {
      type: true,
      city: { include: { country: true } },
      doctors: {
        where: { isActive: true },
        orderBy: [{ rating: "desc" }, { name: "asc" }],
        include: {
          specialty: true,
          facility: { include: { city: { include: { country: true } } } },
        },
      },
    },
  });
  if (!facility || !facility.isActive) notFound();

  const images = parseJsonArray(facility.images);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-teal-700">
          Home
        </Link>{" "}
        /{" "}
        <Link
          href={`/c/${facility.city.country.code.toLowerCase()}`}
          className="hover:text-teal-700"
        >
          {facility.city.country.name}
        </Link>{" "}
        /{" "}
        <Link
          href={`/c/${facility.city.country.code.toLowerCase()}/${slugify(facility.city.name)}`}
          className="hover:text-teal-700"
        >
          {facility.city.name}
        </Link>{" "}
        / <span className="text-slate-700">{facility.name}</span>
      </nav>

      {/* Banner */}
      <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-teal-500 p-8 text-white sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
            {facility.type.icon} {facility.type.name}
          </span>
          {facility.isVerified && (
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm font-medium text-emerald-50">
              ✓ Verified
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{facility.name}</h1>
        <p className="mt-2 text-teal-50">
          📍 {facility.address} — {facility.city.name},{" "}
          {flagEmoji(facility.city.country.code)} {facility.city.country.name}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-8">
          {facility.description && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">About</h2>
              <p className="mt-2 leading-relaxed text-slate-600">
                {facility.description}
              </p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Doctors ({facility.doctors.length})
            </h2>
            <div className="mt-4 space-y-4">
              {facility.doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
              {facility.doctors.length === 0 && (
                <p className="text-slate-400">
                  No doctors listed at this facility yet.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">Contact</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {facility.phone && <li>📞 {facility.phone}</li>}
              {facility.email && <li>✉️ {facility.email}</li>}
              <li>🏙️ {facility.city.name}</li>
              <li>
                🌍 {facility.city.country.name} ({facility.city.country.code})
              </li>
            </ul>
            {facility.mapUrl && (
              <a
                href={facility.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg bg-teal-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                🗺️ Open in Maps
              </a>
            )}
          </div>

          {images.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Photos</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {images.slice(0, 4).map((src) => (
                  // Plain <img> — external gallery URLs are unoptimized by design
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt={`${facility.name} photo`}
                    className="h-24 w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
