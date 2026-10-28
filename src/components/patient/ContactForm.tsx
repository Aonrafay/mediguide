"use client";

import { useActionState } from "react";

import { sendContactMessage, type ContactState } from "@/lib/actions/contact";

export default function ContactForm({
  labels,
}: {
  labels: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
    send: string;
    sending: string;
  };
}) {
  const [state, formAction, isPending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    {}
  );

  const inputClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200";

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl">📨</p>
        <p className="mt-3 font-semibold text-emerald-800">{state.success}</p>
        <form action={formAction} className="mt-4">
          <button
            type="submit"
            className="text-sm font-medium text-teal-700 hover:underline"
          >
            Send another message
          </button>
        </form>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            {labels.name}
          </label>
          <input name="name" required className={inputClass} placeholder="Ali Raza" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            {labels.email}
          </label>
          <input
            name="email"
            type="email"
            required
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            {labels.phone}
          </label>
          <input name="phone" className={inputClass} placeholder="+92 300 0000000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            {labels.subject}
          </label>
          <input
            name="subject"
            required
            className={inputClass}
            placeholder="Listing inquiry, booking problem…"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">
          {labels.message}
        </label>
        <textarea name="message" rows={5} required minLength={10} className={inputClass} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? labels.sending : labels.send}
      </button>
    </form>
  );
}
