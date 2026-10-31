"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireAdminScope } from "@/lib/adminScope";
import { ADMIN_COUNTRY_COOKIE } from "@/lib/adminContext";
import { db } from "@/lib/db";

/** Super admin enters a country's panel (sets the context cookie). */
export async function selectAdminCountry(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const countryId = String(formData.get("countryId") ?? "").trim();

  const country = await db.country.findUnique({
    where: { id: countryId },
    select: { id: true },
  });
  if (!country) redirect("/admin");

  const store = await cookies();
  store.set(ADMIN_COUNTRY_COOKIE, countryId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60, // panel context expires after 12h
  });

  redirect("/admin");
}

/** Super admin exits the country panel back to the Global Home. */
export async function clearAdminCountry() {
  await requireAdminScope({ superOnly: true });
  const store = await cookies();
  store.delete(ADMIN_COUNTRY_COOKIE);
  redirect("/admin");
}
