import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Admin Login" };

// Login reads the session + redirect query — allow a blocking render.
export const instant = false;

export default async function AdminLoginPage({
  searchParams,
}: PageProps<"/admin/login">) {
  const session = await getSession();
  if (session?.role === "ADMIN") redirect("/admin");

  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-3xl">
            🏥
          </div>
          <h1 className="text-2xl font-bold text-slate-900">MediGuide</h1>
          <p className="mt-1 text-sm text-slate-500">Admin panel sign in</p>
        </div>

        <LoginForm redirectTo={typeof next === "string" ? next : undefined} />

        <p className="mt-6 text-center text-xs text-slate-400">
          Default credentials after seeding: admin@mediguide.com / Admin@123
        </p>
      </div>
    </main>
  );
}
