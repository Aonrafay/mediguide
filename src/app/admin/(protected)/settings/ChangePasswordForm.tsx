"use client";

import { useActionState } from "react";

import { changeAdminPassword, type PasswordState } from "@/lib/actions/users";

export default function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState<PasswordState, FormData>(
    changeAdminPassword,
    {}
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700">
          Current password
        </label>
        <input
          name="current"
          type="password"
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">New password</label>
        <input
          name="next"
          type="password"
          required
          minLength={8}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        {isPending ? "Updating…" : "Change password"}
      </button>
    </form>
  );
}
