import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAdminScope, ScopeError, type AdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";

/**
 * Country-context cookie — a VIEW selector for super admins.
 * Super admin with no context  → GLOBAL home (country cards + tools)
 * Super admin with context     → that country's panel (acts as country admin)
 * Country admin account        → always forced to their own country
 */
export const ADMIN_COUNTRY_COOKIE = "mg_admin_country";

export type AdminContext =
  | { mode: "GLOBAL" }
  | {
      mode: "COUNTRY";
      countryId: string;
      countryName: string;
      countryCode: string;
      /** true = country-admin account (locked to own country); false = super admin browsing */
      isOwnPanel: boolean;
    };

/**
 * Resolve the effective admin view:
 * combines the account's scope (User.countryId) with the selected context cookie.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const scope = await getAdminScope();
  if (!scope) return null;

  // Country-admin accounts are locked to their own country — no cookie involved
  if (scope.type === "COUNTRY") {
    return {
      mode: "COUNTRY",
      countryId: scope.countryId,
      countryName: scope.countryName,
      countryCode: scope.countryCode,
      isOwnPanel: true,
    };
  }

  // Super admin: country context comes from the cookie
  const store = await cookies();
  const selected = store.get(ADMIN_COUNTRY_COOKIE)?.value;
  if (!selected) return { mode: "GLOBAL" };

  const country = await db.country.findUnique({
    where: { id: selected },
    select: { id: true, name: true, code: true },
  });
  if (!country) return { mode: "GLOBAL" };

  return {
    mode: "COUNTRY",
    countryId: country.id,
    countryName: country.name,
    countryCode: country.code,
    isOwnPanel: false,
  };
}

/**
 * Scope for country-section pages/actions. A super admin inside a country
 * panel acts exactly like that country's admin (consistent + secure).
 */
export async function getEffectiveScope(): Promise<AdminScope | null> {
  const ctx = await getAdminContext();
  if (!ctx) return null;
  if (ctx.mode === "COUNTRY") {
    return {
      type: "COUNTRY",
      countryId: ctx.countryId,
      countryName: ctx.countryName,
      countryCode: ctx.countryCode,
    };
  }
  return { type: "SUPER" };
}

/** Pages: country sections require a selected country (drill-down model). */
export async function requireCountryView() {
  const ctx = await getAdminContext();
  if (!ctx) redirect("/admin/login?next=/admin");
  if (ctx.mode !== "COUNTRY") redirect("/admin");
  return ctx;
}

/** Actions: country mutations require a selected country. */
export async function requireCountryScope() {
  const ctx = await getAdminContext();
  if (!ctx) throw new ScopeError("UNAUTHORIZED");
  if (ctx.mode !== "COUNTRY") throw new ScopeError("NO_COUNTRY_CONTEXT");
  return {
    type: "COUNTRY",
    countryId: ctx.countryId,
    countryName: ctx.countryName,
    countryCode: ctx.countryCode,
  } as const;
}
