import Link from "next/link";

import { DoctorCard } from "@/components/patient/cards";
import { db } from "@/lib/db";

export const metadata = { title: "Find Doctors" };
export const instant = false;

const SORTS = [
  { value: "rating", label: "Top rated" },
  { value: "experience", label: "Most experienced" },
  { value: "fee", label: "Lowest fee" },
  { value: "name", label: "Name (A–Z)" },
] as const;

export default async function DoctorsDirectoryPage({
  searchParams,
}: PageProps<"/doctors">) {
  const { q, country, city, specialty, video, sort } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const countryId = typeof country === "string" ? country : "";
  const cityId = typeof city === "string" ? city : "";
  const specialtyId = typeof specialty === "string" ? specialty : "";
  const videoOnly = video === "1";
  const sortBy = SORTS.some((s) => s.value === sort) ? sort! : "rating";

  const [countries, cities, specialties, doctors] = await Promise.all([
    db.country.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: { country: { select: { name: true } } },
    }),
    db.specialty.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    db.doctor.findMany({
      where: {
        isActive: true,
        ...(specialtyId ? { specialtyId } : {}),
        ...(videoOnly ? { offersVideo: true } : {}),
        ...(cityId ? { facility: { cityId } } : countryId ? { facility: { city: { countryId } } } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query } },
                { qualification: { contains: query } },
                { specialty: { is: { name: { contains: query } } } },
              ],
            }
          : {}),
      },
      orderBy:
        sortBy === "experience"
          ? { experienceYears: "desc" }
          : sortBy === "fee"
            ? { inPersonFee: "asc" }
            : sortBy === "name"
              ? { name: "asc" }
              : [{ rating: "desc" }, { name: "asc" }],
      include: {
        specialty: true,
        facility: { include: { city: { include: { country: true } } } },
      },
    }),
  ]);

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-500";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Find Doctors</h1>
        <p className="mt-1 text-slate-500">
          {doctors.length} doctor{doctors.length === 1 ? "" : "s"} found
          {query && ` for “${query}”`}
        </p>
      </header>

      {/* Filters */}
      <form className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        {/* Keep the header search term when filtering */}
        <input type="hidden" name="q" value={query} />

        <select name="country" defaultValue={countryId} className={selectClass}>
          <option value="">All countries</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select name="city" defaultValue={cityId} className={selectClass}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} — {c.country.name}
            </option>
          ))}
        </select>

        <select name="specialty" defaultValue={specialtyId} className={selectClass}>
          <option value="">All specialties</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {s.name}
            </option>
          ))}
        </select>

        <select name="sort" defaultValue={sortBy} className={selectClass}>
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            name="video"
            value="1"
            defaultChecked={videoOnly}
            className="h-4 w-4 rounded border-slate-300 accent-teal-600"
          />
          🎥 Video only
        </label>

        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          Apply
        </button>
        {(countryId || cityId || specialtyId || videoOnly || query) && (
          <Link
            href="/doctors"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Clear all
          </Link>
        )}
      </form>

      {/* Results */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {doctors.map((doctor) => (
          <DoctorCard key={doctor.id} doctor={doctor} />
        ))}
        {doctors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400 md:col-span-2">
            No doctors match your filters — try clearing some.
          </div>
        )}
      </div>
    </main>
  );
}
