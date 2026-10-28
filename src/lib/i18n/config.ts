/** i18n configuration — static config; active list lives in the DB (Language table). */

export const DEFAULT_LOCALE = "en";

/** UI dictionary availability. Content translations (DB) work for ANY language. */
export const UI_LOCALES = ["en", "ar", "ur", "fr", "tr", "hi"] as const;

export const LOCALE_DIRECTIONS: Record<string, "ltr" | "rtl"> = {
  en: "ltr",
  ar: "rtl",
  ur: "rtl",
  fr: "ltr",
  tr: "ltr",
  hi: "ltr",
};

export const LOCALE_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  ar: "🇸🇦",
  ur: "🇵🇰",
  fr: "🇫🇷",
  tr: "🇹🇷",
  hi: "🇮🇳",
};

export function directionOf(locale: string): "ltr" | "rtl" {
  return LOCALE_DIRECTIONS[locale] ?? "ltr";
}
