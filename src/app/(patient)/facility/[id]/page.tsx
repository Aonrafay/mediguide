import Link from "next/link";
import { notFound } from "next/navigation";

import { DoctorCard } from "@/components/patient/cards";
import { db } from "@/lib/db";
import { flagEmoji, parseJsonArray, slugify } from "@/lib/slugs";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

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
  const { locale, t } = await getI18n();
  const tr = await loadContentTranslator(locale, [
    "Country",
    "City",
    "Facility",
    "FacilityType",
    "Specialty",
  ]);

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

  const countryName = tr("Country", facility.city.country.id, "name", facility.city.country.name);
  const cityName = tr("City", facility.city.id, "name", facility.city.name);
  const facilityName = tr("Facility", facility.id, "name", facility.name);
  const typeName = tr("FacilityType", facility.typeId, "name", facility.type.name);
  const description = tr("Facility", facility.id, "description", facility.description ?? "");

  const images = parseJsonArray(facility.images);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-slate-500">
        <Link href="/" className="hover:text-teal-700">
          {t("common.home")}
        </Link>{" "}
        /{" "}
        <Link
          href={`/c/${facility.city.country.code.toLowerCase()}`}
          className="hover:text-teal-700"
        >
          {countryName}
        </Link>{" "}
        /{" "}
        <Link
          href={`/c/${facility.city.country.code.toLowerCase()}/${slugify(facility.city.name)}`}
          className="hover:text-teal-700"
        >
          {cityName}
        </Link>{" "}
        / <span className="text-slate-700">{facilityName}</span>
      </nav>

      {/* Banner */}
      <div className="mt-4 overflow-hidden rounded-3xl bg-gradient-to-r from-teal-600 to-teal-500 p-8 text-white sm:p-10">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-white/15 px-3 py-1 text-sm">
            {facility.type.icon} {typeName}
          </span>
          {facility.isVerified && (
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-sm font-medium text-emerald-50">
              {t("facility.verified")}
            </span>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{facilityName}</h1>
        <p className="mt-2 text-teal-50">
          📍 {facility.address} — {cityName}, {flagEmoji(facility.city.country.code)}{" "}
          {countryName}
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-8">
          {description && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">{t("facility.about")}</h2>
              <p className="mt-2 leading-relaxed text-slate-600">{description}</p>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              {t("facility.doctors", { n: facility.doctors.length })}
            </h2>
            <div className="mt-4 space-y-4">
              {facility.doctors.map((doctor) => (
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
                      name: facilityName,
                      city: {
                        name: cityName,
                        country: { name: countryName, code: facility.city.country.code },
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
              {facility.doctors.length === 0 && (
                <p className="text-slate-400">{t("facility.noDoctors")}</p>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-bold text-slate-900">{t("facility.contact")}</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {facility.phone && <li>📞 {facility.phone}</li>}
              {facility.email && <li>✉️ {facility.email}</li>}
              <li>🏙️ {cityName}</li>
              <li>
                🌍 {countryName} ({facility.city.country.code})
              </li>
            </ul>
            {facility.mapUrl && (
              <a
                href={facility.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block rounded-lg bg-teal-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-teal-700"
              >
                {t("facility.openMaps")}
              </a>
            )}
          </div>

          {images.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">{t("facility.photos")}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {images.slice(0, 4).map((src) => (
                  // Plain <img> — external gallery URLs are unoptimized by design
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt={`${facilityName} photo`}
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
