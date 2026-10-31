"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  requireAdminScope,
  cityInScope,
  facilityInScope,
  doctorInScope,
  ScopeError,
} from "@/lib/adminScope";
import { requireCountryScope } from "@/lib/adminContext";
import { db } from "@/lib/db";

/* ------------------------------- helpers ------------------------------- */

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optStr(formData: FormData, key: string) {
  const value = str(formData, key);
  return value === "" ? null : value;
}

function num(formData: FormData, key: string) {
  const value = str(formData, key);
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(formData: FormData, key: string) {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

/** Translate driver errors into human-friendly messages. */
function friendlyError(error: unknown) {
  if (error instanceof ScopeError) {
    if (error.message === "FORBIDDEN_GLOBAL_SECTION")
      return "This section is managed by the super admin only.";
    if (error.message === "NO_COUNTRY_CONTEXT")
      return "Open a country panel first — click a country on the Admin Home.";
    return "You do not have permission for this action (other country).";
  }
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "P2002") return "A record with this name/value already exists.";
  if (code === "P2003")
    return "Cannot delete: linked records (cities, doctors or appointments) exist.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

/**
 * Run a mutation, then redirect back to `path` — with an error message in the
 * query string when it failed. redirect() throws, so it stays outside try/catch.
 */
async function run(path: string, mutate: () => Promise<unknown>) {
  let error: string | undefined;
  const result = await (async () => {
    try {
      return await mutate();
    } catch (caught) {
      return friendlyError(caught);
    }
  })();
  if (typeof result === "string") error = result;
  revalidatePath(path);
  redirect(error ? `${path}?error=${encodeURIComponent(error)}` : path);
}

/* ------------------------------- countries ------------------------------ */
/* Global hierarchy — super admin only.                                     */

export async function saveCountry(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = optStr(formData, "id");
  const name = str(formData, "name");
  const code = str(formData, "code").toUpperCase();
  const phoneCode = optStr(formData, "phoneCode");
  const isActive = bool(formData, "isActive");

  await run("/admin", async () => {
    if (!name || !code) return "Name and code are required.";
    const data = { name, code, phoneCode, isActive };
    if (id) await db.country.update({ where: { id }, data });
    else await db.country.create({ data });
  });
}

export async function deleteCountry(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  await run("/admin", () => db.country.delete({ where: { id } }));
}

/* --------------------------------- cities ------------------------------- */

export async function saveCity(formData: FormData) {
  const scope = await requireCountryScope();
  const id = optStr(formData, "id");
  const name = str(formData, "name");
  const countryId = str(formData, "countryId");
  const isActive = bool(formData, "isActive");

  await run("/admin/cities", async () => {
    if (!name || !countryId) return "City name and country are required.";
    if (scope.countryId !== countryId)
      return "You can only add cities in the country panel you opened.";
    if (id && !(await cityInScope(scope, id)))
      return "This city belongs to another country.";
    const data = { name, countryId, isActive };
    if (id) await db.city.update({ where: { id }, data });
    else await db.city.create({ data });
  });
}

export async function deleteCity(formData: FormData) {
  const scope = await requireCountryScope();
  const id = str(formData, "id");
  await run("/admin/cities", async () => {
    if (!(await cityInScope(scope, id)))
      return "This city belongs to another country.";
    await db.city.delete({ where: { id } });
  });
}

/* ---------------------------- facility types ---------------------------- */
/* Global vocabulary — super admin only.                                    */

export async function saveFacilityType(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = optStr(formData, "id");
  const name = str(formData, "name");
  const icon = optStr(formData, "icon");
  const isActive = bool(formData, "isActive");

  await run("/admin/facility-types", async () => {
    if (!name) return "Name is required.";
    const data = { name, icon, isActive };
    if (id) await db.facilityType.update({ where: { id }, data });
    else await db.facilityType.create({ data });
  });
}

export async function deleteFacilityType(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  await run("/admin/facility-types", () =>
    db.facilityType.delete({ where: { id } })
  );
}

/* ------------------------------ specialties ------------------------------ */
/* Global vocabulary — super admin only.                                    */

export async function saveSpecialty(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = optStr(formData, "id");
  const name = str(formData, "name");
  const icon = optStr(formData, "icon");
  const description = optStr(formData, "description");
  const isActive = bool(formData, "isActive");

  await run("/admin/specialties", async () => {
    if (!name) return "Name is required.";
    const data = { name, icon, description, isActive };
    if (id) await db.specialty.update({ where: { id }, data });
    else await db.specialty.create({ data });
  });
}

export async function deleteSpecialty(formData: FormData) {
  await requireAdminScope({ superOnly: true });
  const id = str(formData, "id");
  await run("/admin/specialties", () => db.specialty.delete({ where: { id } }));
}

/* ------------------------------- facilities ------------------------------ */

export async function saveFacility(formData: FormData) {
  const scope = await requireCountryScope();
  const id = optStr(formData, "id");
  const name = str(formData, "name");
  const cityId = str(formData, "cityId");
  const typeId = str(formData, "typeId");
  const address = str(formData, "address");
  const description = optStr(formData, "description");
  const phone = optStr(formData, "phone");
  const email = optStr(formData, "email");
  const mapUrl = optStr(formData, "mapUrl");
  const images = str(formData, "images")
    .split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  await run("/admin/facilities", async () => {
    if (!name || !cityId || !typeId || !address)
      return "Name, city, type and address are required.";
    if (scope.type === "COUNTRY" && !(await cityInScope(scope, cityId)))
      return "You can only add facilities in your own country's cities.";    if (id && !(await facilityInScope(scope, id)))
      return "This facility belongs to another country.";
    const data = {
      name,
      cityId,
      typeId,
      address,
      description,
      phone,
      email,
      mapUrl,
      images: JSON.stringify(images),
    };
    if (id) await db.facility.update({ where: { id }, data });
    else await db.facility.create({ data });
  });
}

export async function deleteFacility(formData: FormData) {
  const scope = await requireCountryScope();
  const id = str(formData, "id");
  await run("/admin/facilities", async () => {
    if (!(await facilityInScope(scope, id)))
      return "This facility belongs to another country.";
    await db.facility.delete({ where: { id } });
  });
}

/* --------------------------------- doctors ------------------------------- */

export async function saveDoctor(formData: FormData) {
  const scope = await requireCountryScope();
  const id = optStr(formData, "id");
  const name = str(formData, "name");
  const facilityId = str(formData, "facilityId");
  const specialtyId = str(formData, "specialtyId");
  const gender = optStr(formData, "gender");
  const qualification = str(formData, "qualification");
  const experienceYears = num(formData, "experienceYears") ?? 0;
  const inPersonFee = num(formData, "inPersonFee") ?? 0;
  const videoFee = num(formData, "videoFee");
  const photo = optStr(formData, "photo");
  const about = optStr(formData, "about");
  const languages = str(formData, "languages")
    .split(",")
    .map((lang) => lang.trim())
    .filter(Boolean);

  await run("/admin/doctors", async () => {
    if (!name || !facilityId || !specialtyId || !qualification)
      return "Name, facility, specialty and qualification are required.";
    if (scope.type === "COUNTRY" && !(await facilityInScope(scope, facilityId)))
      return "You can only add doctors to facilities in your own country.";
    if (id && !(await doctorInScope(scope, id)))
      return "This doctor belongs to another country.";
    const data = {
      name,
      facilityId,
      specialtyId,
      gender,
      qualification,
      experienceYears,
      inPersonFee,
      videoFee,
      offersVideo: videoFee != null,
      photo,
      about,
      languages: JSON.stringify(languages),
    };
    if (id) await db.doctor.update({ where: { id }, data });
    else await db.doctor.create({ data });
  });
}

export async function deleteDoctor(formData: FormData) {
  const scope = await requireCountryScope();
  const id = str(formData, "id");
  await run("/admin/doctors", async () => {
    if (!(await doctorInScope(scope, id)))
      return "This doctor belongs to another country.";
    await db.doctor.delete({ where: { id } });
  });
}

/* ------------------------------ availability ----------------------------- */

export async function saveAvailability(formData: FormData) {
  const scope = await requireCountryScope();
  const doctorId = str(formData, "doctorId");
  const dayOfWeek = num(formData, "dayOfWeek") ?? 1;
  const startTime = str(formData, "startTime");
  const endTime = str(formData, "endTime");
  const slotDurationMin = num(formData, "slotDurationMin") ?? 30;
  const mode = str(formData, "mode") || "BOTH";

  await run(`/admin/doctors/${doctorId}/availability`, async () => {
    if (!(await doctorInScope(scope, doctorId)))
      return "This doctor belongs to another country.";
    if (!startTime || !endTime) return "Start and end time are required.";
    if (endTime <= startTime) return "End time must be after start time.";
    await db.availability.create({
      data: { doctorId, dayOfWeek, startTime, endTime, slotDurationMin, mode },
    });
  });
}

export async function deleteAvailability(formData: FormData) {
  const scope = await requireCountryScope();
  const id = str(formData, "id");
  const doctorId = str(formData, "doctorId");
  await run(`/admin/doctors/${doctorId}/availability`, async () => {
    if (!(await doctorInScope(scope, doctorId)))
      return "This doctor belongs to another country.";
    await db.availability.delete({ where: { id } });
  });
}
