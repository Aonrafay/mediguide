"use client";

import Link from "next/link";
import { useActionState } from "react";

import { register, type RegisterState } from "@/lib/actions/booking";

const initialState: RegisterState = {};

export default function RegisterForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState(register, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-700">
          Full name
        </label>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          placeholder="Ali Raza"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
