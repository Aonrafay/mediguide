import Link from "next/link";
import { redirect } from "next/navigation";

import TransferForm from "@/components/patient/TransferForm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  cancelHistoryTransfer,
  revokeHistoryTransfer,
} from "@/lib/actions/transfer";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/constants";
import { formatDateUTC } from "@/lib/utils";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

export const metadata = { title: "Transfer History" };
export const instant = false;

const STATUS_BADGE: Record<string, string> = {
  NEW: "bg-amber-100 text-amber-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-rose-100 text-rose-700",
  REVOKED: "bg-slate-200 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const STATUS_KEY: Record<string, string> = {
  NEW: "trf.stNew",
  ACCEPTED: "trf.stAccepted",
  DECLINED: "trf.stDeclined",
  REVOKED: "trf.stRevoked",
  CANCELLED: "trf.stCancelled",
};

export default async function TransferPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/transfer");
  if (session.role === "ADMIN") redirect("/admin");
  if (session.role === "DEPARTMENT") redirect("/department");

  const { locale, t } = await getI18n();
  const tr = await loadContentTranslator(locale, ["City", "Facility", "Specialty"]);

  const [appointments, targetFacilities, transfers] = await Promise.all([
    db.appointment.findMany({
      where: { patientId: session.userId },
      orderBy: [{ date: "desc" }, { timeSlot: "desc" }],
      include: {
        doctor: { include: { specialty: true, facility: true } },
      },
    }),
    db.facility.findMany({
      where: {
        isActive: true,
        departmentUsers: { some: { role: "DEPARTMENT" } },
      },
      include: { type: true, city: true },
      orderBy: { name: "asc" },
    }),
    db.historyTransfer.findMany({
      where: { patientId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        sourceFacility: true,
        targetFacility: { include: { type: true, city: true } },
        items: { include: { appointment: { include: { doctor: true } } } },
      },
    }),
  ]);

  // Facilities the patient has actually visited — natural source options
  const visited = new Map<string, string>();
  for (const appt of appointments) {
    visited.set(appt.doctor.facility.id, appt.doctor.facility.name);
  }

  const now = new Date();
  const startOfTodayUtc = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const formLabels: Record<string, string> = {
    source: t("trf.source"),
    sourceAll: t("trf.sourceAll"),
    target: t("trf.target"),
    targetPlaceholder: t("trf.targetPlaceholder"),
    records: t("trf.records", { n: appointments.length }),
    recordsHint: t("trf.recordsHint"),
    note: t("trf.note"),
    submit: t("trf.submit"),
    sending: t("trf.sending"),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/account" className="hover:text-teal-700">
          {t("notif.back")}
        </Link>
      </nav>

      <header className="mt-4">
        <h1 className="text-3xl font-bold text-slate-900">{t("trf.title")}</h1>
        <p className="mt-1 text-slate-500">{t("trf.sub")}</p>
      </header>

      {/* Request form */}
      {appointments.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
          {t("trf.noVisits")}{" "}
          <Link href="/doctors" className="text-teal-700 hover:underline">
            {t("acct.findDoctor")}
          </Link>
        </p>
      ) : targetFacilities.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
          {t("trf.noTargets")}
        </p>
      ) : (
        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
          <TransferForm
            labels={formLabels}
            sources={Array.from(visited, ([id, name]) => ({ id, name }))}
            targets={targetFacilities.map((f) => ({
              id: f.id,
              name: f.name,
              city: tr("City", f.city.id, "name", f.city.name),
              type: f.type.name,
            }))}
            records={appointments.map((appt) => ({
              id: appt.id,
              doctorName: appt.doctor.name,
              specialtyIcon: appt.doctor.specialty.icon ?? "🩺",
              specialtyName: tr(
                "Specialty",
                appt.doctor.specialty.id,
                "name",
                appt.doctor.specialty.name
              ),
              facilityName: tr(
                "Facility",
                appt.doctor.facility.id,
                "name",
                appt.doctor.facility.name
              ),
              dateLabel: formatDateUTC(appt.date),
              timeSlot: appt.timeSlot,
              statusLabel:
                APPOINTMENT_STATUS_LABELS[appt.status as AppointmentStatus],
              preselected:
                appt.status === "COMPLETED" || appt.status === "CONFIRMED",
            }))}
          />
        </section>
      )}

      {/* My transfers */}
      <section className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">
          {t("trf.myTransfers", { n: transfers.length })}
        </h2>
        <div className="mt-4 space-y-4">
          {transfers.map((transfer) => (
            <div
              key={transfer.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold text-slate-900">
                      {transfer.sourceFacility
                        ? `${transfer.sourceFacility.name} → ${transfer.targetFacility.name}`
                        : `${t("trf.entireRecord")} → ${transfer.targetFacility.name}`}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        STATUS_BADGE[transfer.status] ?? "bg-slate-100"
                      }`}
                    >
                      {t(STATUS_KEY[transfer.status] ?? "trf.stNew")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {t("trf.recordsCount", { n: transfer.items.length })} ·{" "}
                    {new Date(transfer.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  {transfer.note && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                      💬 {transfer.note}
                    </p>
                  )}
                  {transfer.status === "DECLINED" && transfer.declineReason && (
                    <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      {t("trf.declineReason", { reason: transfer.declineReason })}
                    </p>
                  )}
                  {transfer.status === "ACCEPTED" && (
                    <p className="mt-2 text-xs text-teal-700">
                      ✔ {t("trf.sharedActive")}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col items-end gap-2">
                  {transfer.status === "NEW" && (
                    <form action={cancelHistoryTransfer}>
                      <input type="hidden" name="id" value={transfer.id} />
                      <button
                        type="submit"
                        className="text-sm font-medium text-slate-500 hover:underline"
                      >
                        {t("trf.cancel")}
                      </button>
                    </form>
                  )}
                  {transfer.status === "ACCEPTED" && (
                    <>
                      <p className="text-xs text-slate-400">{t("trf.revokeHint")}</p>
                      <form action={revokeHistoryTransfer}>
                        <input type="hidden" name="id" value={transfer.id} />
                        <button
                          type="submit"
                          className="rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100"
                        >
                          {t("trf.revoke")}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {transfers.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              {t("trf.emptyTransfers")}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
