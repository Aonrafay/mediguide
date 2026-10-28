/** Site theme (light/dark) — stored in a cookie so SSR renders the right theme with no flash. */

export const THEME_COOKIE = "mg_theme";

export type Theme = "light" | "dark";

export function normalizeTheme(value: string | undefined): Theme {
  return value === "dark" ? "dark" : "light";
}
