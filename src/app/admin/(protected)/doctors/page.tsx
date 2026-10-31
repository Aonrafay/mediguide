import Link from "next/link";

import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  CheckField,
  ErrorBanner,
  Field,
  FieldRow,
  PageHeader,
  Table,
  inputClass,
} from "@/components/admin/table";
import { deleteDoctor, saveDoctor } from "@/lib/actions/admin";
import { doctorWhere, getAdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";
import { GENDERS } from "@/lib/constants";
import { formatFee } from "@/lib/utils";

export const metadata = { title: "Doctors" };
export const instant = false;

function doctorFormFields(
  facilities: {
    id: string;
    name: string;
    city: { name: string; country: { name: string } };
  }[],
  specialties: { id: string; name: string }[],
  doctor?: {
    id: string;
    name: string;
    facilityId: string;
    specialtyId: string;
    gender: string | null;
    qualification: string;
    experienceYears: number;
    inPersonFee: number;
    videoFee: number | null;
    photo: string | null;
    about: string | null;
    languages: string;
  }
) {
  let languagesValue = "";
  if (doctor) {
    try {
      languagesValue = (JSON.parse(doctor.languages) as string[]).join(", ");
    } catch {
      languagesValue = "";
    }
  }
  return (
    <>
      {doctor && <input type="hidden" name="id" value={doctor.id} />}
      <FieldRow>
        <Field label="Doctor name">
          <input
            name="name"
            required
            defaultValue={doctor?.name}
            className={inputClass}
            placeholder="Dr. Ahmed Hassan"
          />
        </Field>
        <Field label="Gender">
          <select name="gender" defaultValue={doctor?.gender ?? ""} className={inputClass}>
            <option value="">Not specified</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g === "MALE" ? "Male" : "Female"}
              </option>
            ))}
          </select>
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Facility">
          <select
            name="facilityId"
            required
            defaultValue={doctor?.facilityId}
            className={inputClass}
          >
            <option value="" disabled>
              Select facility…
            </option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.city.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Specialty">
          <select
            name="specialtyId"
            required
            defaultValue={doctor?.specialtyId}
            className={inputClass}
          >
            <option value="" disabled>
              Select specialty…
            </option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="Qualification" hint="e.g. MBBS, FCPS (Cardiology)">
          <input
            name="qualification"
            required
            defaultValue={doctor?.qualification}
            className={inputClass}
          />
        </Field>
        <Field label="Experience (years)">
          <input
            name="experienceYears"
            type="number"
            min={0}
            defaultValue={doctor?.experienceYears ?? 0}
            className={inputClass}
          />
        </Field>
      </FieldRow>
      <FieldRow>
        <Field label="In-person fee">
          <input
            name="inPersonFee"
            type="number"
            min={0}
            required
            defaultValue={doctor?.inPersonFee ?? 0}
            className={inputClass}
          />
        </Field>
        <Field label="Video fee" hint="Leave empty if no online consultations">
          <input
            name="videoFee"
            type="number"
            min={0}
            defaultValue={doctor?.videoFee ?? ""}
            className={inputClass}
          />
        </Field>
      </FieldRow>
      <Field label="Photo URL">
        <input name="photo" defaultValue={doctor?.photo ?? ""} className={inputClass} />
      </Field>
      <Field label="About" hint="Short bio shown on the doctor profile">
        <textarea name="about" rows={3} defaultValue={doctor?.about ?? ""} className={inputClass} />
      </Field>
      <Field label="Languages" hint="Comma-separated, e.g. English, Urdu">
        <input name="languages" defaultValue={languagesValue} className={inputClass} />
      </Field>
    </>
  );
}

export default async function DoctorsPage({
  searchParams,
}: PageProps<"/admin/doctors">) {
  const scope = await getAdminScope();
  if (!scope) return null;
  const scoped = scope.type === "COUNTRY";

  const { error, facility, specialty } = await searchParams;
  const facilityFilter = typeof facility === "string" ? facility : undefined;
  const specialtyFilter = typeof specialty === "string" ? specialty : undefined;

  const [facilities, specialties, doctors] = await Promise.all([
    db.facility.findMany({
      where: scoped ? { city: { countryId: scope.countryId } } : {},
      orderBy: { name: "asc" },
      include: { city: { include: { country: true } } },
    }),
    db.specialty.findMany({ orderBy: { name: "asc" } }),
    db.doctor.findMany({
      where: {
        ...doctorWhere(scope),
        ...(facilityFilter ? { facilityId: facilityFilter } : {}),
        ...(specialtyFilter ? { specialtyId: specialtyFilter } : {}),
      },
      orderBy: { name: "asc" },
      include: {
        facility: { include: { city: { include: { country: true } } } },
        specialty: true,
        _count: { select: { appointments: true, availability: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Doctors"
        subtitle={
          scoped
            ? `Doctors working in ${scope.countryName}'s facilities. Manage timings via Availability.`
            : "Doctor profiles belong to a facility and a specialty. Manage timings via Availability."
        }
      >
        <EntityDialog
          title="Add Doctor"
          action={saveDoctor}
          trigger="＋ Add Doctor"
          wide
        >
          {doctorFormFields(facilities, specialties)}
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {facilityFilter && (
          <Link
            href="/admin/doctors"
            className="rounded-full bg-teal-600 px-3 py-1.5 font-medium text-white"
          >
            Filtered by facility ✕
          </Link>
        )}
        {specialtyFilter && (
          <Link
            href="/admin/doctors"
            className="rounded-full bg-teal-600 px-3 py-1.5 font-medium text-white"
          >
            Filtered by specialty ✕
          </Link>
        )}
        <span className="text-slate-500">{doctors.length} doctor(s)</span>
      </div>

      <Table
        head={["Doctor", "Specialty", "Facility", "Fees", "Slots", "Actions"]}
      >
        {doctors.map((doctor) => {
          let languages: string[] = [];
          try {
            languages = JSON.parse(doctor.languages) as string[];
          } catch {
            languages = [];
          }
          return (
            <tr key={doctor.id} className="text-slate-700">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{doctor.name}</p>
                <p className="text-xs text-slate-400">
                  {doctor.qualification} · {doctor.experienceYears}y
                  {languages.length > 0 && ` · ${languages.join(", ")}`}
                </p>
              </td>
              <td className="px-4 py-3">
                {doctor.specialty.icon} {doctor.specialty.name}
              </td>
              <td className="px-4 py-3">
                {doctor.facility.name}
                <span className="text-xs text-slate-400"> · {doctor.facility.city.name}</span>
              </td>
              <td className="px-4 py-3">
                <p>{formatFee(doctor.inPersonFee)}</p>
                <p className="text-xs text-slate-400">
                  {doctor.videoFee != null
                    ? `🎥 ${formatFee(doctor.videoFee)}`
                    : "No video"}
                </p>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/admin/doctors/${doctor.id}/availability`}
                  className="text-teal-700 hover:underline"
                >
                  {doctor._count.availability} window(s)
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <EntityDialog
                    title={`Edit ${doctor.name}`}
                    action={saveDoctor}
                    openLabel="Edit"
                    wide
                  >
                    {doctorFormFields(facilities, specialties, doctor)}
                  </EntityDialog>
                  <DeleteButton
                    action={deleteDoctor}
                    id={doctor.id}
                    confirmMessage={`Delete ${doctor.name}? Their availability and appointments will be affected.`}
                  />
                </div>
              </td>
            </tr>
          );
        })}
      </Table>
    </div>
  );
}
