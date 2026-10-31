import "server-only";

import { getSession, type SessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type AdminScope =
  | { type: "SUPER" }
  | { type: "COUNTRY"; countryId: string; countryName: string; countryCode: string };

/**
 * Resolve the data scope of the signed-in admin.
 * - User.countryId = null  → SUPER admin (whole platform)
 * - User.countryId = set   → COUNTRY admin (that country only)
 *
 * Returns null when the visitor is not an admin.
 */
export async function getAdminScope(): Promise<AdminScope | null> {
  const session: SessionUser | null = await getSession();
  if (!session || session.role !== "ADMIN") return null;

  if (!session.countryId) return { type: "SUPER" };

  const country = await db.country.findUnique({
    where: { id: session.countryId },
    select: { id: true, name: true, code: true },
  });
  // Country was deleted → fall back to super scope to avoid a locked-out admin
  if (!country) return { type: "SUPER" };

  return {
    type: "COUNTRY",
    countryId: country.id,
    countryName: country.name,
    countryCode: country.code,
  };
}

/** Thrown by requireAdminScope when access must stop. */
export class ScopeError extends Error {}

/** Guard: must be an admin; optionally must be SUPER. */
export async function requireAdminScope(options?: { superOnly?: boolean }) {
  const scope = await getAdminScope();
  if (!scope) throw new ScopeError("UNAUTHORIZED");
  if (options?.superOnly && scope.type !== "SUPER") {
    throw new ScopeError("FORBIDDEN_GLOBAL_SECTION");
  }
  return scope;
}

/** Guard: must be an admin of the given country (SUPER passes any country). */
export async function requireCountryAccess(countryId: string) {
  const scope = await getAdminScope();
  if (!scope) throw new ScopeError("UNAUTHORIZED");
  if (scope.type === "COUNTRY" && scope.countryId !== countryId) {
    throw new ScopeError("FORBIDDEN_OTHER_COUNTRY");
  }
  return scope;
}

/* ------------------------------------------------------------------ */
/* Prisma where-builders — every admin list page filters through these */
/* ------------------------------------------------------------------ */

export function cityWhere(scope: AdminScope) {
  return scope.type === "COUNTRY" ? { countryId: scope.countryId } : {};
}

export function facilityWhere(scope: AdminScope) {
  return scope.type === "COUNTRY"
    ? { city: { countryId: scope.countryId } }
    : {};
}

export function doctorWhere(scope: AdminScope) {
  return scope.type === "COUNTRY"
    ? { facility: { city: { countryId: scope.countryId } } }
    : {};
}

export function appointmentWhere(scope: AdminScope) {
  return scope.type === "COUNTRY"
    ? { facility: { city: { countryId: scope.countryId } } }
    : {};
}

export function reviewWhere(scope: AdminScope) {
  return scope.type === "COUNTRY"
    ? { doctor: { facility: { city: { countryId: scope.countryId } } } }
    : {};
}

export function userWhere(scope: AdminScope) {
  return scope.type === "COUNTRY" ? { countryId: scope.countryId } : {};
}

/** Verify a doctor belongs to the admin's scope before mutating it. */
export async function doctorInScope(scope: AdminScope, doctorId: string) {
  if (scope.type === "SUPER") return true;
  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    select: { facility: { select: { city: { select: { countryId: true } } } } },
  });
  return doctor?.facility.city.countryId === scope.countryId;
}

/** Verify a facility belongs to the admin's scope before mutating it. */
export async function facilityInScope(scope: AdminScope, facilityId: string) {
  if (scope.type === "SUPER") return true;
  const facility = await db.facility.findUnique({
    where: { id: facilityId },
    select: { city: { select: { countryId: true } } },
  });
  return facility?.city.countryId === scope.countryId;
}

/** Verify an appointment belongs to the admin's scope before mutating it. */
export async function appointmentInScope(scope: AdminScope, appointmentId: string) {
  if (scope.type === "SUPER") return true;
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { facility: { select: { city: { select: { countryId: true } } } } },
  });
  return appointment?.facility.city.countryId === scope.countryId;
}

/** Verify a city belongs to the admin's scope before mutating it. */
export async function cityInScope(scope: AdminScope, cityId: string) {
  if (scope.type === "SUPER") return true;
  const city = await db.city.findUnique({
    where: { id: cityId },
    select: { countryId: true },
  });
  return city?.countryId === scope.countryId;
}

/** Verify a review belongs to the admin's scope before moderating it. */
export async function reviewInScope(scope: AdminScope, reviewId: string) {
  if (scope.type === "SUPER") return true;
  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: { doctor: { select: { facility: { select: { city: { select: { countryId: true } } } } } } },
  });
  return review?.doctor.facility.city.countryId === scope.countryId;
}
