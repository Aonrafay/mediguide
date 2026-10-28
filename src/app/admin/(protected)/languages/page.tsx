import Link from "next/link";

import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  ErrorBanner,
  Field,
  FieldRow,
  PageHeader,
  Table,
  inputClass,
} from "@/components/admin/table";
import {
  deleteLanguage,
  saveLanguage,
  setDefaultLanguage,
  toggleLanguageActive,
} from "@/lib/actions/i18nAdmin";
import { db } from "@/lib/db";
import { LOCALE_FLAGS, UI_LOCALES } from "@/lib/i18n/config";

export const metadata = { title: "Languages" };
export const instant = false;

export default async function AdminLanguagesPage({
  searchParams,
}: PageProps<"/admin/languages">) {
  const { error } = await searchParams;
  const languages = await db.language.findMany({
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });

  const counts = await db.contentTranslation.groupBy({
    by: ["languageCode"],
    _count: true,
  });
  const countMap = new Map(counts.map((c) => [c.languageCode, c._count]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Languages"
        subtitle="Enable languages for the patient site. Content translations (names, descriptions) are managed in the Translations editor."
      >
        <Link
          href="/admin/translations"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          🌐 Open Translations editor
        </Link>
      </PageHeader>

      <ErrorBanner message={error} />

      <EntityDialog title="Add language" action={saveLanguage} trigger="＋ Add Language">
        <FieldRow>
          <Field label="Code" hint="2 letters, e.g. ar, fr, es">
            <input
              name="code"
              required
              maxLength={5}
              className={inputClass}
              placeholder="es"
            />
          </Field>
          <Field label="Direction">
            <select name="direction" defaultValue="ltr" className={inputClass}>
              <option value="ltr">LTR (left-to-right)</option>
              <option value="rtl">RTL (right-to-left)</option>
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="English name">
            <input name="name" required className={inputClass} placeholder="Spanish" />
          </Field>
          <Field label="Native name" hint="Shown in the switcher">
            <input
              name="nativeName"
              required
              className={inputClass}
              placeholder="Español"
            />
          </Field>
        </FieldRow>
      </EntityDialog>

      <Table
        head={["Language", "Code", "Direction", "Translations", "Status", "Actions"]}
      >
        {languages.map((language) => (
          <tr key={language.code} className="text-slate-700">
            <td className="px-4 py-3 font-medium text-slate-900">
              {LOCALE_FLAGS[language.code] ?? "🌐"} {language.nativeName}
              <span className="text-xs text-slate-400"> ({language.name})</span>
            </td>
            <td className="px-4 py-3">{language.code}</td>
            <td className="px-4 py-3">{language.direction.toUpperCase()}</td>
            <td className="px-4 py-3">{countMap.get(language.code) ?? 0}</td>
            <td className="px-4 py-3">
              {language.isDefault
                ? "⭐ Default"
                : language.isActive
                  ? "✅ Active"
                  : "⬜ Inactive"}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/admin/translations?lang=${language.code}`}
                  className="rounded-lg px-2.5 py-1 font-medium text-teal-700 ring-1 ring-teal-200 transition hover:bg-teal-50"
                >
                  Translate
                </Link>
                {!language.isDefault && (
                  <form action={setDefaultLanguage}>
                    <input type="hidden" name="code" value={language.code} />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
                    >
                      Set default
                    </button>
                  </form>
                )}
                {!language.isDefault && (
                  <form action={toggleLanguageActive}>
                    <input type="hidden" name="code" value={language.code} />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50"
                    >
                      {language.isActive ? "Disable" : "Enable"}
                    </button>
                  </form>
                )}
                {!language.isDefault && (
                  <DeleteButton
                    action={deleteLanguage}
                    id={language.code}
                    confirmMessage={`Delete ${language.name} and all its translations?`}
                  />
                )}
                {!UI_LOCALES.includes(language.code as "en") && (
                  <span
                    title="UI strings fall back to English for this language"
                    className="text-slate-400"
                  >
                    (UI: EN)
                  </span>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
