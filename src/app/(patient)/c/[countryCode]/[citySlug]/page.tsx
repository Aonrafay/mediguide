import Link from "next/link";
import { notFound } from "next/navigation";

import { FacilityCard } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { flagEmoji, slugify } from "@/lib/slugs";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

export const instant = false;

type Props = PageProps<"/c/[countryCode]/[citySlug]">;

export async function generateMetadata({ params }: Props) {
  const { countryCode, citySlug } = await params;
  const country = await db.country.findFirst({
    where: { code: countryCode.toUpperCase(), isActive: true },
  });
  const city = country
    ? (await db.city.findMany({ where: { countryId: country.id, isActive: true } })).find(
        (c) => slugify(c.name) === citySlug
      )
    : null;
  return {
    title: city ? `Doctors & Facilities in ${city.name}` : "City",
  };
}

export default async function CityPage({ params }: Props) {
  const { countryCode, citySlug } = await params;
  const { locale, t } = await getI18n();
  const tr = await loadContentTranslator(locale, [
    "Country",
    "City",
    "Facility",
    "FacilityType",
  ]);

  const country = await db.country.findFirst({
    where: { code: countryCode.toUpperCase(), isActive: true },
  });
  if (!country) notFound();

  const city = (await db.city.findMany({
    where: { countryId: country.id, isActive: true },
    include: {
      facilities: {
        where: { isActive: true },
        include: { type: true, _count: { select: { doctors: true } } },
      },
    },
  })).find((c) => slugify(c.name) === citySlug);
  if (!city) notFound();

  const countryName = tr("Country", country.id, "name", country.name);
  const cityName = tr("City", city.id, "name", city.name);

  // Facilities grouped by facility type
  const typeCounts = new Map<string, number>();
  for (const facility of city.facilities) {
    typeCounts.set(facility.typeId, (typeCounts.get(facility.typeId) ?? 0) + 1);
  }
  const types = await db.facilityType.findMany({ orderBy: { name: "asc" } });
  const availableTypes = types
    .map((type) => ({
      type,
      name: tr("FacilityType", type.id, "name", type.name),
      count: typeCounts.get(type.id) ?? 0,
    }))
    .filter((entry) => entry.count > 0);

  const totalDoctors = city.facilities.reduce(
    (sum, f) => sum + f._count.doctors,
    0
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-teal-700">
          {t("common.home")}
        </Link>{" "}
        /{" "}
        <Link
          href={`/c/${country.code.toLowerCase()}`}
          className="hover:text-teal-700"
        >
          {countryName}
        </Link>{" "}
        / <span className="text-slate-700">{cityName}</span>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">
          {flagEmoji(country.code)} Healthcare in {cityName}
        </h1>
        <p className="mt-1 text-slate-500">
          {t("cty.facilitiesIn", { n: city.facilities.length })} ·{" "}
          {t("cty.doctorsCount", { n: totalDoctors })}
        </p>
      </header>

      {/* Facility type filter cards */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-900">{t("cty.browseType")}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {availableTypes.map(({ type, name, count }) => (
            <Link
              key={type.id}
              href={`/c/${country.code.toLowerCase()}/${slugify(city.name)}/${slugify(type.name)}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-center transition hover:border-teal-300 hover:shadow-md"
            >
              <p className="text-4xl">{type.icon ?? "🏢"}</p>
              <p className="mt-2 font-bold text-slate-900">{name}</p>
              <p className="text-sm text-slate-500">{t("cty.available", { n: count })}</p>
            </Link>
          ))}
          {availableTypes.length === 0 && (
            <p className="text-slate-400">
              {t("cty.noFacilities", { city: cityName })}
            </p>
          )}
        </div>
      </section>

      {/* All facilities */}
      {city.facilities.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">{t("cty.allFacilities")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {city.facilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={{
                  ...facility,
                  name: tr("Facility", facility.id, "name", facility.name),
                  type: {
                    ...facility.type,
                    name: tr("FacilityType", facility.typeId, "name", facility.type.name),
                  },
                  city: {
                    name: cityName,
                    country: { name: countryName, code: country.code },
                  },
                }}
                labels={{
                  verified: t("facility.verified"),
                  doctors: (n) => t("card.doctors", { n }),
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
