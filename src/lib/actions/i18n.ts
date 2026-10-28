"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LOCALE_COOKIE } from "@/lib/i18n/server";
import { UI_LOCALES } from "@/lib/i18n/config";

/** Switch the UI language (cookie) and stay on the same page. */
export async function setLocale(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  const path = String(formData.get("path") ?? "/");

  if (UI_LOCALES.includes(locale as "en")) {
    const store = await cookies();
    store.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }
  redirect(path.startsWith("/") ? path : "/");
}
