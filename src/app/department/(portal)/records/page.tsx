import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/admin/table";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  APPOINTMENT_STATUS_LABELS,
  type AppointmentStatus,
} from "@/lib/constants";
import { formatDateUTC } from "@/lib/utils";
import { getI18n, loadContentTranslator } from "@/lib/i18n/server";

export const metadata = { title: "Shared Patient Histories" };
export const instant = false;

export default async function SharedRecordsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/department/records");
  if (session.role !== "DEPARTMENT") redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { facilityId: true },
  });
  if (!user?.facilityId) redirect("/");

  const { t, locale } = await getI18n();
  const tr = await loadContentTranslator(locale, ["Facility"]);

  const transfers = await db.historyTransfer.findMany({
    where: { targetFacilityId: user.facilityId, status: "ACCEPTED" },
    orderBy: { decidedAt: "desc" },
    include: {
      patient: { select: { name: true, email: true, phone: true } },
      sourceFacility: true,
      items: {
        include: {
          appointment: {
            include: {
              facility: true,
              doctor: { include: { specialty: true } },
            },
          },
        },
      },
    },
  });

  const revoked = await db.historyTransfer.count({
    where: { targetFacilityId: user.facilityId, status: "REVOKED" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dept.recordsTitle")}
        subtitle={t("dept.recordsSub")}
      >
        <Link
          href="/department"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          ← {t("dept.backToRequests")}
        </Link>
      </PageHeader>

      {revoked > 0 && (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          {t("dept.revokedNote", { n: revoked })}
        </p>
      )}

      <div className="space-y-4">
        {transfers.map((transfer) => (
          <div
            key={transfer.id}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold text-slate-900">
                    {transfer.patient.name}
                  </p>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    ✔ {t("trf.stAccepted")}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                    📂 {t("trf.recordsCount", { n: transfer.items.length })}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-600">
                  {t("trf.deptFrom", {
                    facility: transfer.sourceFacility?.name ?? t("trf.entireRecord"),
                  })}{" "}
                  · ✉️ {transfer.patient.email}
                  {transfer.patient.phone && ` · 📞 ${transfer.patient.phone}`}
                </p>
                {transfer.note && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    💬 {transfer.note}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  {t("dept.sharedSince", {
                    date: transfer.decidedAt
                      ? new Date(transfer.decidedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—",
                  })}
                </p>
              </div>
            </div>

            {/* The shared records themselves */}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-start text-xs text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-start font-medium">{t("dept.thDoctor")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("dept.thFacility")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("dept.thWhen")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("dept.thStatus")}</th>
                    <th className="px-3 py-2 text-start font-medium">{t("dept.thNotes")}</th>
                  </tr>
                </thead>
                <tbody>
                  {transfer.items.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        {item.appointment.doctor.specialty.icon}{" "}
                        {item.appointment.doctor.specialty.name} ·{" "}
                        <span className="font-semibold text-slate-900">
                          {item.appointment.doctor.name}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {tr(
                          "Facility",
                          item.appointment.facilityId,
                          "name",
                          item.appointment.facility.name
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {formatDateUTC(item.appointment.date)} · 🕐{" "}
                        {item.appointment.timeSlot}
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {
                            APPOINTMENT_STATUS_LABELS[
                              item.appointment.status as AppointmentStatus
                            ]
                          }
                        </span>
                      </td>
                      <td className="max-w-[16rem] px-3 py-2 text-xs text-slate-500">
                        {item.appointment.notes ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {transfers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-4xl">📂</p>
            <p className="mt-3 font-medium text-slate-600">
              {t("dept.recordsEmpty")}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {t("dept.recordsEmptyHint")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
