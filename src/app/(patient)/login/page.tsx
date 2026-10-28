import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Sign in" };
export const instant = false;

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const session = await getSession();
  if (session) redirect("/");

  const { next } = await searchParams;

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 text-3xl">
            🏥
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to book appointments and manage your bookings
          </p>
        </div>

        <LoginForm redirectTo={typeof next === "string" ? next : undefined} />

        <p className="mt-6 text-center text-sm text-slate-500">
          New to MediGuide?{" "}
          <Link
            href={`/register${typeof next === "string" ? `?next=${next}` : ""}`}
            className="font-medium text-teal-700 hover:underline"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">
          Demo patient: patient@mediguide.com / Patient@123
        </p>
      </div>
    </main>
  );
}
