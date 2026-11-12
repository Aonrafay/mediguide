"use client";

import { useActionState } from "react";

import { createHistoryTransfer, type TransferState } from "@/lib/actions/transfer";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200";

export default function TransferForm({
  labels,
  sources,
  targets,
  records,
}: {
  labels: Record<string, string>;
  sources: { id: string; name: string }[];
  targets: { id: string; name: string; city: string; type: string }[];
  records: {
    id: string;
    doctorName: string;
    specialtyIcon: string;
    specialtyName: string;
    facilityName: string;
    dateLabel: string;
    timeSlot: string;
    statusLabel: string;
    preselected: boolean;
  }[];
}) {
  const [state, formAction, isPending] = useActionState<TransferState, FormData>(
    createHistoryTransfer,
    {}
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl">📂</p>
        <p className="mt-3 font-semibold text-emerald-800">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Step 1 — source */}
      <div>
        <label className="block text-sm font-semibold text-slate-700">
          {labels.source}
        </label>
        <select name="sourceFacilityId" className={inputClass} defaultValue="">
          <option value="">{labels.sourceAll}</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Step 2 — destination */}
      <div>
        <label className="block text-sm font-semibold text-slate-700">
          {labels.target}
        </label>
        <select name="targetFacilityId" required className={inputClass} defaultValue="">
          <option value="">{labels.targetPlaceholder}</option>
          {targets.map((f) => (
            <option key={f.id} value={f.id}>
              {f.city} — {f.name} ({f.type})
            </option>
          ))}
        </select>
      </div>

      {/* Step 3 — records */}
      <div>
        <p className="text-sm font-semibold text-slate-700">{labels.records}</p>
        <p className="mt-1 text-xs text-slate-500">{labels.recordsHint}</p>
        <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pe-1">
          {records.map((r) => (
            <label
              key={r.id}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-teal-300"
            >
              <input
                type="checkbox"
                name="appointmentIds"
                value={r.id}
                defaultChecked={r.preselected}
                className="mt-1 h-4 w-4 rounded border-slate-300 accent-teal-600"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-900">{r.doctorName}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    {r.statusLabel}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-slate-500">
                  {r.specialtyIcon} {r.specialtyName} · {r.facilityName}
                </span>
                <span className="block text-xs font-medium text-slate-700">
                  📅 {r.dateLabel} · 🕐 {r.timeSlot}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-semibold text-slate-700">
          {labels.note}
        </label>
        <textarea name="note" rows={3} className={inputClass} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-teal-600 px-5 py-2.5 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
      >
        {isPending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
