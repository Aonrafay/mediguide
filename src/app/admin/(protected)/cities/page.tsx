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
import { cityWhere, getAdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";

export const metadata = { title: "Cities" };
export const instant = false;

export default async function CitiesPage({
  searchParams,
}: PageProps<"/admin/cities">) {
  const scope = await getAdminScope();
  if (!scope) return null;
  const scoped = scope.type === "COUNTRY";

  const { error, country } = await searchParams;
  const countryFilter = typeof country === "string" ? country : undefined;

  const [countries, cities] = await Promise.all([
    // Country admins pick their own country automatically; super picks any
    db.country.findMany({ orderBy: { name: "asc" } }),
    db.city.findMany({
      where: {
        ...cityWhere(scope),
        ...(countryFilter ? { countryId: countryFilter } : {}),
      },
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
        subtitle={
          scoped
            ? `Cities of ${scope.countryName} — patients filter by country, then city.`
            : "Cities belong to a country — patients filter by country, then city."
        }
      >
        <EntityDialog title="Add City" action={saveCity} trigger="＋ Add City">
          {scoped ? (
            // Country admin: fixed to their own country
            <>
              <input type="hidden" name="countryId" value={scope.countryId} />
              <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
                Adding to <b>{scope.countryName}</b>
              </p>
            </>
          ) : (
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
          )}
          <Field label="City name">
            <input name="name" required className={inputClass} placeholder="Lahore" />
          </Field>
          <CheckField name="isActive" label="Active (visible to patients)" />
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      {/* Country filter — super admin only (country admins see one country) */}
      {!scoped && (
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
      )}

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
                  {scoped ? (
                    <input type="hidden" name="countryId" value={city.countryId} />
                  ) : (
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
                  )}
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
