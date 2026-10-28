import Link from "next/link";

import { ErrorBanner, PageHeader } from "@/components/admin/table";
import { SubmitButton } from "@/components/admin/ui";
import { saveTranslation } from "@/lib/actions/i18nAdmin";
import { db } from "@/lib/db";
import { directionOf } from "@/lib/i18n/config";

export const metadata = { title: "Translations" };
export const instant = false;

const EDITABLE_TYPES = [
  { entityType: "Country", label: "Countries", field: "name" },
  { entityType: "City", label: "Cities", field: "name" },
  { entityType: "FacilityType", label: "Facility Types", field: "name" },
  { entityType: "Specialty", label: "Specialties", field: "name" },
  { entityType: "Facility", label: "Facilities", field: "name" },
] as const;

export default async function TranslationsPage({
  searchParams,
}: PageProps<"/admin/translations">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : undefined;
  const langParam = typeof sp.lang === "string" ? sp.lang : "";

  const languages = await db.language.findMany({
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });
  const language = languages.find((l) => l.code === langParam) ?? languages[0]!;
  const dir = directionOf(language.code);

  // Existing translations for this language
  const existing = await db.contentTranslation.findMany({
    where: { languageCode: language.code, field: "name" },
  });
  const existingMap = new Map(
    existing.map((r) => [`${r.entityType}:${r.entityId}`, r.value])
  );

  // Entities to translate (English name = fallback)
  const [countries, cities, facilityTypes, specialties, facilities] =
    await Promise.all([
      db.country.findMany({ orderBy: { name: "asc" } }),
      db.city.findMany({
        orderBy: { name: "asc" },
        include: { country: { select: { name: true } } },
      }),
      db.facilityType.findMany({ orderBy: { name: "asc" } }),
      db.specialty.findMany({ orderBy: { name: "asc" } }),
      db.facility.findMany({
        orderBy: { name: "asc" },
        include: { city: { select: { name: true } } },
      }),
    ]);

  const sections: Record<string, { id: string; label: string }[]> = {
    Country: countries.map((c) => ({ id: c.id, label: c.name })),
    City: cities.map((c) => ({ id: c.id, label: `${c.name} — ${c.country.name}` })),
    FacilityType: facilityTypes.map((t) => ({ id: t.id, label: t.name })),
    Specialty: specialties.map((s) => ({ id: s.id, label: s.name })),
    Facility: facilities.map((f) => ({
      id: f.id,
      label: `${f.name} — ${f.city.name}`,
    })),
  };

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Translations — ${language.nativeName}`}
        subtitle={`Enter ${language.name} names. Empty fields fall back to English. Direction: ${dir.toUpperCase()}.`}
      >
        <Link
          href="/admin/languages"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          ← Languages
        </Link>
      </PageHeader>

      <ErrorBanner message={error} />

      {/* Language selector */}
      <div className="flex flex-wrap gap-2">
        {languages.map((l) => (
          <Link
            key={l.code}
            href={`/admin/translations?lang=${l.code}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              l.code === language.code
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {l.nativeName}
          </Link>
        ))}
      </div>

      {/* Translation sections */}
      {EDITABLE_TYPES.map(({ entityType, label }) => (
        <section key={entityType} className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">
            {label} <span className="text-xs font-normal text-slate-400">({sections[entityType]!.length})</span>
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {sections[entityType]!.map((entity) => (
              <form
                key={entity.id}
                action={saveTranslation}
                className="flex items-center gap-2 rounded-xl bg-slate-50 p-2"
              >
                <input type="hidden" name="lang" value={language.code} />
                <input type="hidden" name="entityType" value={entityType} />
                <input type="hidden" name="entityId" value={entity.id} />
                <input type="hidden" name="field" value="name" />
                <span className="min-w-0 flex-1 truncate px-1 text-sm text-slate-500">
                  {entity.label}
                </span>
                <input
                  name="value"
                  defaultValue={existingMap.get(`${entityType}:${entity.id}`) ?? ""}
                  placeholder="—"
                  dir={dir}
                  className="w-44 shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                />
                <SubmitButton label="💾" />
              </form>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
