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
import { db } from "@/lib/db";

export const metadata = { title: "Cities" };
export const instant = false;

export default async function CitiesPage({
  searchParams,
}: PageProps<"/admin/cities">) {
  const { error, country } = await searchParams;
  const countryFilter = typeof country === "string" ? country : undefined;

  const [countries, cities] = await Promise.all([
    db.country.findMany({ orderBy: { name: "asc" } }),
    db.city.findMany({
      where: countryFilter ? { countryId: countryFilter } : undefined,
      orderBy: [{ country: { name: "asc" } }, { name: "asc" }],
      include: {
        country: { select: { name: true } },
        _count: { select: { facilities: true } },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cities"
        subtitle="Cities belong to a country — patients filter by country, then city."
      >
        <EntityDialog title="Add City" action={saveCity} trigger="＋ Add City">
          <Field label="Country">
            <select name="countryId" required className={inputClass} defaultValue="">
              <option value="" disabled>
                Select a country…
              </option>
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="City name">
            <input name="name" required className={inputClass} placeholder="Lahore" />
          </Field>
          <CheckField name="isActive" label="Active (visible to patients)" />
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      {/* Country filter */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/cities"
          className={`rounded-full px-3 py-1.5 text-sm font-medium ${
            !countryFilter
              ? "bg-teal-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          }`}
        >
          All
        </a>
        {countries.map((c) => (
          <a
            key={c.id}
            href={`/admin/cities?country=${c.id}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              countryFilter === c.id
                ? "bg-teal-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {c.name}
          </a>
        ))}
      </div>

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
                  <Field label="Country">
                    <select
                      name="countryId"
                      required
                      defaultValue={city.countryId}
                      className={inputClass}
                    >
                      {countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
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
