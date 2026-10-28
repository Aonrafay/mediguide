import Link from "next/link";

import { DoctorCard } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

export const metadata = { title: "Find Doctors" };
export const instant = false;

const SORTS = ["rating", "experience", "fee", "name"] as const;
type Sort = (typeof SORTS)[number];

export default async function DoctorsDirectoryPage({
  searchParams,
}: PageProps<"/doctors">) {
  const { locale, t } = await getI18n();
  const tr = await loadContentTranslator(locale, [
    "Country",
    "City",
    "Facility",
    "Specialty",
  ]);

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const countryId = typeof sp.country === "string" ? sp.country : "";
  const cityId = typeof sp.city === "string" ? sp.city : "";
  const specialtyId = typeof sp.specialty === "string" ? sp.specialty : "";
  const videoOnly = sp.video === "1";
  const sortBy = SORTS.includes(sp.sort as Sort) ? (sp.sort as Sort) : "rating";

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
        ...(cityId
          ? { facility: { cityId } }
          : countryId
            ? { facility: { city: { countryId } } }
            : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q } },
                { qualification: { contains: q } },
                { specialty: { is: { name: { contains: q } } } },
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

  const sortLabels: Record<Sort, string> = {
    rating: t("dir.sortRating"),
    experience: t("dir.sortExperience"),
    fee: t("dir.sortFee"),
    name: t("dir.sortName"),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">{t("dir.title")}</h1>
        <p className="mt-1 text-slate-500">
          {t("dir.found", { n: doctors.length })}
          {q && ` ${t("dir.for", { q })}`}
        </p>
      </header>

      {/* Filters */}
      <form className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        {/* Keep the header search term when filtering */}
        <input type="hidden" name="q" value={q} />

        <select name="country" defaultValue={countryId} className={selectClass}>
          <option value="">{t("dir.allCountries")}</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {tr("Country", c.id, "name", c.name)}
            </option>
          ))}
        </select>

        <select name="city" defaultValue={cityId} className={selectClass}>
          <option value="">{t("dir.allCities")}</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {tr("City", c.id, "name", c.name)} —{" "}
              {tr("Country", c.countryId, "name", c.country.name)}
            </option>
          ))}
        </select>

        <select name="specialty" defaultValue={specialtyId} className={selectClass}>
          <option value="">{t("dir.allSpecialties")}</option>
          {specialties.map((s) => (
            <option key={s.id} value={s.id}>
              {s.icon} {tr("Specialty", s.id, "name", s.name)}
            </option>
          ))}
        </select>

        <select name="sort" defaultValue={sortBy} className={selectClass}>
          {SORTS.map((s) => (
            <option key={s} value={s}>
              {sortLabels[s]}
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
          {t("dir.videoOnly")}
        </label>

        <button
          type="submit"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          {t("dir.apply")}
        </button>
        {(countryId || cityId || specialtyId || videoOnly || q) && (
          <Link
            href="/doctors"
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            {t("dir.clear")}
          </Link>
        )}
      </form>

      {/* Results */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {doctors.map((doctor) => (
          <DoctorCard
            key={doctor.id}
            doctor={{
              ...doctor,
              specialty: {
                ...doctor.specialty,
                name: tr("Specialty", doctor.specialtyId, "name", doctor.specialty.name),
              },
              facility: {
                ...doctor.facility,
                name: tr("Facility", doctor.facilityId, "name", doctor.facility.name),
                city: {
                  ...doctor.facility.city,
                  name: tr("City", doctor.facility.cityId, "name", doctor.facility.city.name),
                  country: {
                    ...doctor.facility.city.country,
                    name: tr(
                      "Country",
                      doctor.facility.city.countryId,
                      "name",
                      doctor.facility.city.country.name
                    ),
                  },
                },
              },
            }}
            labels={{
              video: t("card.video"),
              yrs: (n) => t("card.yrs", { n }),
              reviews: (n) => `(${n})`,
              newLabel: t("card.new"),
            }}
          />
        ))}
        {doctors.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400 md:col-span-2">
            {t("dir.none")}
          </div>
        )}
      </div>
    </main>
  );
}
