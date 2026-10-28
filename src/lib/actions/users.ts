"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function friendlyError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "P2002") return "A user with this email already exists.";
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

export async function saveUser(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const role = str(formData, "role");
  const phone = str(formData, "phone");
  const password = String(formData.get("password") ?? "");

  await run("/admin/users", async () => {
    if (!name || !email) return "Name and email are required.";
    if (!ROLES.includes(role as "ADMIN")) return "Invalid role.";
    if (password && password.length < 8)
      return "Password must be at least 8 characters.";

    if (id) {
      const data: Record<string, unknown> = { name, email, role, phone: phone || null };
      if (password) data.passwordHash = await bcrypt.hash(password, 10);
      await db.user.update({ where: { id }, data });
    } else {
      if (!password) return "Password is required for new users.";
      await db.user.create({
        data: {
          name,
          email,
          role,
          phone: phone || null,
          passwordHash: await bcrypt.hash(password, 10),
        },
      });
    }
  });
}

export async function deleteUser(formData: FormData) {
  const session = await requireRole("ADMIN");
  const id = str(formData, "id");

  await run("/admin/users", async () => {
    if (id === session.userId) return "You cannot delete your own account.";
    await db.user.delete({ where: { id } });
  });
}

/* ------------------------- admin change password -------------------------- */

export type PasswordState = { error?: string; success?: string };

export async function changeAdminPassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await requireRole("ADMIN").catch(() => null);
  if (!session) return { error: "Not signed in." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");

  if (next.length < 8) return { error: "New password must be at least 8 characters." };

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user) return { error: "Account not found." };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };

  await db.user.update({
    where: { id: session.userId },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });

  return { success: "Password updated ✅" };
}
