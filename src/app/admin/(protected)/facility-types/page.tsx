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
import { deleteFacilityType, saveFacilityType } from "@/lib/actions/admin";
import { db } from "@/lib/db";

export const metadata = { title: "Facility Types" };
export const instant = false;

export default async function FacilityTypesPage({
  searchParams,
}: PageProps<"/admin/facility-types">) {
  const { error } = await searchParams;
  const types = await db.facilityType.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { facilities: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facility Types"
        subtitle="Hospital, Clinic, Medical Complex, Lab — patients choose one of these after city."
      >
        <EntityDialog
          title="Add Facility Type"
          action={saveFacilityType}
          trigger="＋ Add Type"
        >
          <FieldRow>
            <Field label="Type name">
              <input name="name" required className={inputClass} placeholder="Hospital" />
            </Field>
            <Field label="Icon" hint="Any emoji, e.g. 🏥">
              <input name="icon" className={inputClass} placeholder="🏥" />
            </Field>
          </FieldRow>
          <CheckField name="isActive" label="Active" />
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      <Table head={["Type", "Icon", "Facilities", "Active", "Actions"]}>
        {types.map((type) => (
          <tr key={type.id} className="text-slate-700">
            <td className="px-4 py-3 font-medium text-slate-900">{type.name}</td>
            <td className="px-4 py-3">{type.icon ?? "—"}</td>
            <td className="px-4 py-3">{type._count.facilities}</td>
            <td className="px-4 py-3">{type.isActive ? "✅" : "⬜"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <EntityDialog
                  title={`Edit ${type.name}`}
                  action={saveFacilityType}
                  openLabel="Edit"
                >
                  <input type="hidden" name="id" value={type.id} />
                  <FieldRow>
                    <Field label="Type name">
                      <input
                        name="name"
                        required
                        defaultValue={type.name}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Icon">
                      <input
                        name="icon"
                        defaultValue={type.icon ?? ""}
                        className={inputClass}
                      />
                    </Field>
                  </FieldRow>
                  <CheckField
                    name="isActive"
                    label="Active"
                    defaultChecked={type.isActive}
                  />
                </EntityDialog>
                <DeleteButton action={deleteFacilityType} id={type.id} />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
