import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  ErrorBanner,
  Field,
  FieldRow,
  PageHeader,
  Table,
  inputClass,
} from "@/components/admin/table";
import { deleteAvailability, saveAvailability } from "@/lib/actions/admin";
import { doctorInScope, type AdminScope } from "@/lib/adminScope";
import { requireCountryView } from "@/lib/adminContext";
import { db } from "@/lib/db";
import { AVAILABILITY_MODE_LABELS, AVAILABILITY_MODES, WEEKDAYS } from "@/lib/constants";

export const metadata = { title: "Doctor Availability" };
export const instant = false;

export default async function AvailabilityPage({
  params,
  searchParams,
}: PageProps<"/admin/doctors/[id]/availability">) {
  const { id } = await params;
  const { error } = await searchParams;

  const scope = await requireCountryView();
  const adminScope: AdminScope = {
    type: "COUNTRY",
    countryId: scope.countryId,
    countryName: scope.countryName,
    countryCode: scope.countryCode,
  };

  // Cannot open another country's doctor
  if (!(await doctorInScope(adminScope, id))) notFound();

  const doctor = await db.doctor.findUnique({
    where: { id },
    include: {
      facility: { include: { city: { include: { country: true } } } },
      availability: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });
  if (!doctor) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Availability — ${doctor.name}`}
        subtitle={`${doctor.facility.name} · ${doctor.facility.city.name}, ${doctor.facility.city.country.name}`}
      >
        <Link
          href="/admin/doctors"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          ← Back to doctors
        </Link>
      </PageHeader>

      <ErrorBanner message={error} />

      <EntityDialog title="Add availability window" action={saveAvailability} trigger="＋ Add Window">
        <input type="hidden" name="doctorId" value={doctor.id} />
        <FieldRow>
          <Field label="Weekday">
            <select name="dayOfWeek" required defaultValue="1" className={inputClass}>
              {WEEKDAYS.map((day, index) => (
                <option key={day} value={index}>
                  {day}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Mode">
            <select name="mode" defaultValue="BOTH" className={inputClass}>
              {AVAILABILITY_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {AVAILABILITY_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </Field>
        </FieldRow>
        <FieldRow>
          <Field label="Start time">
            <input name="startTime" type="time" required defaultValue="09:00" className={inputClass} />
          </Field>
          <Field label="End time">
            <input name="endTime" type="time" required defaultValue="14:00" className={inputClass} />
          </Field>
        </FieldRow>
        <Field label="Slot duration (minutes)" hint="Each appointment occupies one slot, e.g. 30">
          <input
            name="slotDurationMin"
            type="number"
            min={10}
            max={120}
            defaultValue={30}
            className={inputClass}
          />
        </Field>
      </EntityDialog>

      <Table head={["Day", "Mode", "Window", "Slot", "Actions"]}>
        {doctor.availability.map((window) => (
          <tr key={window.id} className="text-slate-700">
            <td className="px-4 py-3 font-medium text-slate-900">
              {WEEKDAYS[window.dayOfWeek] ?? "—"}
            </td>
            <td className="px-4 py-3">{AVAILABILITY_MODE_LABELS[window.mode as "BOTH"] ?? window.mode}</td>
            <td className="px-4 py-3">
              {window.startTime} – {window.endTime}
            </td>
            <td className="px-4 py-3">{window.slotDurationMin} min</td>
            <td className="px-4 py-3">
              <DeleteButton
                action={deleteAvailability}
                id={window.id}
                confirmMessage="Remove this availability window?"
              />
            </td>
          </tr>
        ))}
        {doctor.availability.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
              No availability yet — add the first window above.
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
}
