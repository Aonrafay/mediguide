import Link from "next/link";

import { DoctorCard } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { flagEmoji } from "@/lib/slugs";

export const instant = false;

export default async function HomePage() {
  const [countries, stats, featuredDoctors] = await Promise.all([
    db.country.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { cities: true } },
      },
    }),
    Promise.all([
      db.country.count({ where: { isActive: true } }),
      db.city.count({ where: { isActive: true } }),
      db.facility.count({ where: { isActive: true } }),
      db.doctor.count({ where: { isActive: true } }),
    ]),
    db.doctor.findMany({
      where: { isActive: true, offersVideo: true },
      orderBy: [{ rating: "desc" }, { experienceYears: "desc" }],
      take: 6,
      include: {
        specialty: true,
        facility: { include: { city: { include: { country: true } } } },
      },
    }),
  ]);

  const [countryCount, cityCount, facilityCount, doctorCount] = stats;

  // Facilities per country for the country cards
  const facilityCounts = await db.facility.groupBy({
    by: ["cityId"],
    where: { isActive: true },
    _count: true,
  });

  const citiesWithCountry = await db.city.findMany({
    where: { isActive: true },
    select: { id: true, countryId: true },
  });
  const cityToCountry = new Map(citiesWithCountry.map((c) => [c.id, c.countryId]));
  const facilitiesByCountry = new Map<string, number>();
  for (const row of facilityCounts) {
    const countryId = cityToCountry.get(row.cityId);
    if (countryId)
      facilitiesByCountry.set(
        countryId,
        (facilitiesByCountry.get(countryId) ?? 0) + row._count
      );
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-b from-teal-700 to-teal-600 text-white">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Find the right care, anywhere
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-teal-50">
            Browse hospitals, clinics, medical complexes and labs across countries
            and cities — explore doctor profiles and book in-person or video
            consultations.
          </p>

          {/* Big search */}
          <form action="/doctors" className="mx-auto mt-8 flex max-w-xl gap-2">
            <input
              name="q"
              placeholder="Search a doctor, specialty… e.g. Cardiology"
              className="w-full rounded-xl px-4 py-3 text-slate-900 shadow-lg outline-none focus:ring-2 focus:ring-teal-300"
            />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-6 py-3 font-semibold shadow-lg transition hover:bg-slate-800"
            >
              Search
            </button>
          </form>

          {/* Live stats */}
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap justify-center gap-x-10 gap-y-4 text-center">
            {[
              { label: "Countries", value: countryCount },
              { label: "Cities", value: cityCount },
              { label: "Facilities", value: facilityCount },
              { label: "Doctors", value: doctorCount },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-teal-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by country */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold text-slate-900">Browse by country</h2>
        <p className="mt-1 text-slate-500">
          Choose a country, then a city, then the type of care you need.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <Link
              key={country.id}
              href={`/c/${country.code.toLowerCase()}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-teal-300 hover:shadow-md"
            >
              <span className="text-4xl">{flagEmoji(country.code)}</span>
              <div>
                <p className="font-bold text-slate-900">{country.name}</p>
                <p className="text-sm text-slate-500">
                  {country._count.cities} cities ·{" "}
                  {facilitiesByCountry.get(country.id) ?? 0} facilities
                </p>
              </div>
              <span className="ml-auto text-slate-300">→</span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-2xl font-bold text-slate-900">
            How MediGuide works
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "🌍",
                title: "1. Choose your location",
                text: "Pick your country and city — MediGuide narrows everything down for you.",
              },
              {
                icon: "🏥",
                title: "2. Pick a facility",
                text: "Compare hospitals, clinics, medical complexes and labs near you.",
              },
              {
                icon: "🩺",
                title: "3. Meet your doctor",
                text: "View profiles, check fees & timings, then book in-person or by video.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-2xl border border-slate-100 bg-slate-50 p-6 text-center"
              >
                <p className="text-4xl">{step.icon}</p>
                <p className="mt-3 font-bold text-slate-900">{step.title}</p>
                <p className="mt-1 text-sm text-slate-500">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured doctors (video consultations available) */}
      {featuredDoctors.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Featured doctors
              </h2>
              <p className="mt-1 text-slate-500">
                Offering video consultations 🎥
              </p>
            </div>
            <Link
              href="/doctors"
              className="text-sm font-semibold text-teal-700 hover:underline"
            >
              View all →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {featuredDoctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
