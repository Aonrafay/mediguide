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
import { deleteCountry, saveCountry } from "@/lib/actions/admin";
import { getAdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Countries" };
export const instant = false;

export default async function CountriesPage({
  searchParams,
}: PageProps<"/admin/countries">) {
  // Global hierarchy — super admin only
  const scope = await getAdminScope();
  if (!scope) return null;
  if (scope.type !== "SUPER") redirect("/admin");

  const { error } = await searchParams;
  const countries = await db.country.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { cities: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Countries"
        subtitle="Top level of the location hierarchy — patients pick a country first."
      >
        <EntityDialog title="Add Country" action={saveCountry} trigger="＋ Add Country">
          <FieldRow>
            <Field label="Country name">
              <input name="name" required className={inputClass} placeholder="Pakistan" />
            </Field>
            <Field label="Country code" hint="2-letter ISO code, e.g. PK">
              <input
                name="code"
                required
                maxLength={2}
                className={inputClass}
                placeholder="PK"
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Phone code" hint="Optional, e.g. +92">
              <input name="phoneCode" className={inputClass} placeholder="+92" />
            </Field>
            <CheckField name="isActive" label="Active (visible to patients)" />
          </FieldRow>
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      <Table head={["Country", "Code", "Phone", "Cities", "Active", "Actions"]}>
        {countries.map((country) => (
          <tr key={country.id} className="text-slate-700">
            <td className="px-4 py-3 font-medium text-slate-900">{country.name}</td>
            <td className="px-4 py-3">{country.code}</td>
            <td className="px-4 py-3">{country.phoneCode ?? "—"}</td>
            <td className="px-4 py-3">{country._count.cities}</td>
            <td className="px-4 py-3">{country.isActive ? "✅" : "⬜"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <EntityDialog
                  title={`Edit ${country.name}`}
                  action={saveCountry}
                  openLabel="Edit"
                >
                  <input type="hidden" name="id" value={country.id} />
                  <FieldRow>
                    <Field label="Country name">
                      <input
                        name="name"
                        required
                        defaultValue={country.name}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Country code">
                      <input
                        name="code"
                        required
                        maxLength={2}
                        defaultValue={country.code}
                        className={inputClass}
                      />
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="Phone code">
                      <input
                        name="phoneCode"
                        defaultValue={country.phoneCode ?? ""}
                        className={inputClass}
                      />
                    </Field>
                    <CheckField
                      name="isActive"
                      label="Active"
                      defaultChecked={country.isActive}
                    />
                  </FieldRow>
                </EntityDialog>
                <DeleteButton
                  action={deleteCountry}
                  id={country.id}
                  confirmMessage={`Delete ${country.name} and ALL its cities, facilities and doctors?`}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
