"use client";

import { useActionState } from "react";

import { submitServiceRequest, type ServiceRequestState } from "@/lib/actions/partner";

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200";

export default function ServiceRequestForm({
  labels,
  facilities,
  packages,
}: {
  labels: Record<string, string>;
  facilities: { id: string; name: string; city: string }[];
  packages: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState<ServiceRequestState, FormData>(
    submitServiceRequest,
    {}
  );

  if (state.success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <p className="text-4xl">🤝</p>
        <p className="mt-3 font-semibold text-emerald-800">{state.success}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">{labels.business}</label>
          <input name="businessName" required className={inputClass} placeholder="City Care Dental" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{labels.person}</label>
          <input name="contactPerson" required className={inputClass} placeholder="Dr. Kamran Ali" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">{labels.email}</label>
          <input name="email" type="email" required className={inputClass} placeholder="you@your-facility.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{labels.phone}</label>
          <input name="phone" className={inputClass} placeholder="+92 300 0000000" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">{labels.busType}</label>
          <select name="businessType" className={inputClass} defaultValue="">
            <option value="">{labels.btOther}</option>
            <option value="HOSPITAL">{labels.btHospital}</option>
            <option value="CLINIC">{labels.btClinic}</option>
            <option value="LAB">{labels.btLab}</option>
            <option value="PHARMACY">{labels.btPharmacy}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">{labels.facility}</label>
          <select name="facilityId" className={inputClass} defaultValue="">
            <option value="">{labels.noFacility}</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.city}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">{labels.plan}</label>
        <select name="packageId" className={inputClass} defaultValue="">
          <option value="">Not sure yet — advise me</option>
          {packages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">{labels.msgLabel}</label>
        <textarea name="message" rows={4} className={inputClass} />
      </div>

      {state.error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
      >
        {isPending ? labels.sending : labels.submit}
      </button>
    </form>
  );
}
