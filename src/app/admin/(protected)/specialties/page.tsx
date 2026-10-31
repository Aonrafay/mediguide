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
import { deleteSpecialty, saveSpecialty } from "@/lib/actions/admin";
import { getAdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Specialties" };
export const instant = false;

export default async function SpecialtiesPage({
  searchParams,
}: PageProps<"/admin/specialties">) {
  const scope = await getAdminScope();
  if (!scope) return null;
  if (scope.type !== "SUPER") redirect("/admin");

  const { error } = await searchParams;
  const specialties = await db.specialty.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { doctors: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Specialties"
        subtitle="Medical specialties (Cardiology, Dental Care…) used to filter doctors."
      >
        <EntityDialog
          title="Add Specialty"
          action={saveSpecialty}
          trigger="＋ Add Specialty"
        >
          <FieldRow>
            <Field label="Specialty name">
              <input
                name="name"
                required
                className={inputClass}
                placeholder="Cardiology"
              />
            </Field>
            <Field label="Icon" hint="Any emoji, e.g. ❤️">
              <input name="icon" className={inputClass} placeholder="❤️" />
            </Field>
          </FieldRow>
          <Field label="Description" hint="Optional short description">
            <textarea name="description" rows={3} className={inputClass} />
          </Field>
          <CheckField name="isActive" label="Active" />
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      <Table head={["Specialty", "Icon", "Doctors", "Active", "Actions"]}>
        {specialties.map((specialty) => (
          <tr key={specialty.id} className="text-slate-700">
            <td className="px-4 py-3 font-medium text-slate-900">{specialty.name}</td>
            <td className="px-4 py-3">{specialty.icon ?? "—"}</td>
            <td className="px-4 py-3">{specialty._count.doctors}</td>
            <td className="px-4 py-3">{specialty.isActive ? "✅" : "⬜"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <EntityDialog
                  title={`Edit ${specialty.name}`}
                  action={saveSpecialty}
                  openLabel="Edit"
                >
                  <input type="hidden" name="id" value={specialty.id} />
                  <FieldRow>
                    <Field label="Specialty name">
                      <input
                        name="name"
                        required
                        defaultValue={specialty.name}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Icon">
                      <input
                        name="icon"
                        defaultValue={specialty.icon ?? ""}
                        className={inputClass}
                      />
                    </Field>
                  </FieldRow>
                  <Field label="Description">
                    <textarea
                      name="description"
                      rows={3}
                      defaultValue={specialty.description ?? ""}
                      className={inputClass}
                    />
                  </Field>
                  <CheckField
                    name="isActive"
                    label="Active"
                    defaultChecked={specialty.isActive}
                  />
                </EntityDialog>
                <DeleteButton action={deleteSpecialty} id={specialty.id} />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
