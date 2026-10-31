import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  CheckField,
  ErrorBanner,
  Field,
  PageHeader,
  Table,
  inputClass,
} from "@/components/admin/table";
import { deleteCity, saveCity } from "@/lib/actions/admin";
import { cityWhere, type AdminScope } from "@/lib/adminScope";
import { requireCountryView } from "@/lib/adminContext";
import { db } from "@/lib/db";

export const metadata = { title: "Cities" };
export const instant = false;

export default async function CitiesPage({
  searchParams,
}: PageProps<"/admin/cities">) {
  // Drill-down: country sections need an open country panel
  const ctx = await requireCountryView();
  const scope: AdminScope = {
    type: "COUNTRY",
    countryId: ctx.countryId,
    countryName: ctx.countryName,
    countryCode: ctx.countryCode,
  };

  const { error } = await searchParams;

  const cities = await db.city.findMany({
    where: cityWhere(scope),
    orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
    include: {
      country: { select: { name: true } },
      _count: { select: { facilities: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cities"
        subtitle={`Cities of ${scope.countryName} — patients filter by country, then city.`}
      >
        <EntityDialog title="Add City" action={saveCity} trigger="＋ Add City">
          {/* Pinned to the open country panel */}
          <input type="hidden" name="countryId" value={scope.countryId} />
          <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
            Adding to <b>{scope.countryName}</b>
          </p>
          <Field label="City name">
            <input name="name" required className={inputClass} placeholder="Lahore" />
          </Field>
          <CheckField name="isActive" label="Active (visible to patients)" />
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      <Table head={["City", "Country", "Facilities", "Active", "Actions"]}>
        {cities.map((city) => (
          <tr key={city.id} className="text-slate-700">
            <td className="px-4 py-3 font-medium text-slate-900">{city.name}</td>
            <td className="px-4 py-3">{city.country.name}</td>
            <td className="px-4 py-3">{city._count.facilities}</td>
            <td className="px-4 py-3">{city.isActive ? "✅" : "⬜"}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <EntityDialog title={`Edit ${city.name}`} action={saveCity} openLabel="Edit">
                  <input type="hidden" name="id" value={city.id} />
                  {/* Keep the city in its (selected) country */}
                  <input type="hidden" name="countryId" value={city.countryId} />
                  <Field label="City name">
                    <input
                      name="name"
                      required
                      defaultValue={city.name}
                      className={inputClass}
                    />
                  </Field>
                  <CheckField
                    name="isActive"
                    label="Active"
                    defaultChecked={city.isActive}
                  />
                </EntityDialog>
                <DeleteButton
                  action={deleteCity}
                  id={city.id}
                  confirmMessage={`Delete ${city.name} and its facilities/doctors?`}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
