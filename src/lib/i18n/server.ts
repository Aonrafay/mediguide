import "server-only";

import { cookies } from "next/headers";

import { db } from "@/lib/db";
import { DEFAULT_LOCALE, directionOf } from "./config";
import { en } from "./dictionaries/en";
import { ar } from "./dictionaries/ar";
import { ur } from "./dictionaries/ur";
import { fr } from "./dictionaries/fr";
import { tr } from "./dictionaries/tr";
import { hi } from "./dictionaries/hi";

export const LOCALE_COOKIE = "mg_locale";

const dictionaries: Record<string, Record<string, string>> = {
  en,
  ar,
  ur,
  fr,
  tr,
  hi,
};

export type Translator = (key: string, vars?: Record<string, string | number>) => string;

/** Read the chosen locale from the cookie (validated against available dicts). */
export async function getLocale(): Promise<string> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value ?? "";
  return dictionaries[value] ? value : DEFAULT_LOCALE;
}

export function getDirection(locale: string) {
  return directionOf(locale);
}

/** Build a translator with {var} interpolation and English fallback. */
export function makeT(locale: string): Translator {
  const dict = dictionaries[locale] ?? en;
  return (key, vars) => {
    let text = dict[key] ?? en[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}

/** Convenience: { locale, t, dir } in one call for server components. */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: makeT(locale), dir: directionOf(locale) };
}

/**
 * Batch-load DB content translations for the given entity types, returning a
 * lookup function: tr("Country", id, "name", fallback). English always
 * returns the fallback (source data is English).
 */
export async function loadContentTranslator(locale: string, entityTypes: string[]) {
  if (locale === DEFAULT_LOCALE) {
    return (_entityType: string, _entityId: string, _field: string, fallback: string) =>
      fallback;
  }
  const rows = await db.contentTranslation.findMany({
    where: { languageCode: locale, entityType: { in: entityTypes } },
    select: { entityType: true, entityId: true, field: true, value: true },
  });
  const map = new Map(
    rows.map((r) => [`${r.entityType}:${r.entityId}:${r.field}`, r.value])
  );
  return (entityType: string, entityId: string, field: string, fallback: string) =>
    map.get(`${entityType}:${entityId}:${field}`) ?? fallback;
}

/** Active languages for the switcher (DB-driven, English always available). */
export async function activeLanguages() {
  const rows = await db.language.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { code: "asc" }],
  });
  if (!rows.some((l) => l.code === DEFAULT_LOCALE)) {
    rows.unshift({
      code: DEFAULT_LOCALE,
      name: "English",
      nativeName: "English",
      direction: "ltr",
      isActive: true,
      isDefault: true,
    });
  }
  return rows;
}
