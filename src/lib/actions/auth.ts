"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import {
  clearSessionCookie,
  setSessionCookie,
  signSession,
} from "@/lib/auth";

export type LoginState = { error?: string };

/** Admin/doctor/patient shared login. */
export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password." };
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    return { error: "Invalid email or password." };
  }

  const token = await signSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role as "ADMIN" | "DEPARTMENT" | "DOCTOR" | "PATIENT",
    countryId: user.countryId,
    facilityId: user.facilityId,
  });
  await setSessionCookie(token);

  // Route by role: admins to the panel, department to its portal, rest home
  redirect(
    redirectTo ||
      (user.role === "ADMIN"
        ? "/admin"
        : user.role === "DEPARTMENT"
          ? "/department"
          : "/")
  );
}

export async function logout() {
  await clearSessionCookie();
  redirect("/");
}
