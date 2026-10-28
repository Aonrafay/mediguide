"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/* ------------------------------ languages -------------------------------- */

export async function saveLanguage(formData: FormData) {
  await requireRole("ADMIN");
  const code = str(formData, "code").toLowerCase();
  const name = str(formData, "name");
  const nativeName = str(formData, "nativeName");
  const direction = str(formData, "direction") === "rtl" ? "rtl" : "ltr";

  await run("/admin/languages", async () => {
    if (!/^[a-z]{2}(-[a-z]{2})?$/.test(code))
      return "Language code must be 2 letters, e.g. ar, fr, pt-BR.";
    if (!name || !nativeName) return "Name and native name are required.";
    const existing = await db.language.findUnique({ where: { code } });
    if (existing) return "This language already exists.";
    await db.language.create({
      data: { code, name, nativeName, direction },
    });
  });
}

export async function toggleLanguageActive(formData: FormData) {
  await requireRole("ADMIN");
  const code = str(formData, "code");
  const language = await db.language.findUnique({ where: { code } });
  if (language && code !== DEFAULT_LOCALE) {
    await db.language.update({
      where: { code },
      data: { isActive: !language.isActive },
    });
  }
  revalidatePath("/admin/languages");
  redirect("/admin/languages");
}

export async function setDefaultLanguage(formData: FormData) {
  await requireRole("ADMIN");
  const code = str(formData, "code");
  const language = await db.language.findUnique({ where: { code } });
  if (language) {
    await db.language.updateMany({ data: { isDefault: false } });
    await db.language.update({
      where: { code },
      data: { isDefault: true, isActive: true },
    });
  }
  revalidatePath("/admin/languages");
  redirect("/admin/languages");
}

export async function deleteLanguage(formData: FormData) {
  await requireRole("ADMIN");
  const code = str(formData, "id");

  await run("/admin/languages", async () => {
    if (code === DEFAULT_LOCALE) return "The default language cannot be deleted.";
    const language = await db.language.findUnique({ where: { code } });
    if (language?.isDefault) return "Set another language as default first.";
    await db.contentTranslation.deleteMany({ where: { languageCode: code } });
    await db.language.delete({ where: { code } });
  });
}

/* ----------------------------- translations ------------------------------- */

/** Upsert one content translation (empty value deletes the row). */
export async function saveTranslation(formData: FormData) {
  await requireRole("ADMIN");
  const languageCode = str(formData, "lang");
  const entityType = str(formData, "entityType");
  const entityId = str(formData, "entityId");
  const field = str(formData, "field") || "name";
  const value = str(formData, "value");

  await run(`/admin/translations?lang=${encodeURIComponent(languageCode)}`, async () => {
    if (!languageCode || !entityType || !entityId)
      return "Missing translation target.";
    const language = await db.language.findUnique({ where: { code: languageCode } });
    if (!language) return "Unknown language.";

    if (value === "") {
      await db.contentTranslation.deleteMany({
        where: { languageCode, entityType, entityId, field },
      });
    } else {
      await db.contentTranslation.upsert({
        where: {
          entityType_entityId_languageCode_field: {
            entityType,
            entityId,
            languageCode,
            field,
          },
        },
        update: { value },
        create: { languageCode, entityType, entityId, field, value },
      });
    }
  });
}

/* --------------------------- shared error runner -------------------------- */

function friendlyError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "P2002") return "This value already exists.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

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
