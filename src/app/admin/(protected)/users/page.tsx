import { DeleteButton, EntityDialog } from "@/components/admin/ui";
import {
  ErrorBanner,
  Field,
  FieldRow,
  PageHeader,
  Table,
  inputClass,
} from "@/components/admin/table";
import { deleteUser, saveUser } from "@/lib/actions/users";
import { getAdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import { redirect } from "next/navigation";

export const metadata = { title: "Users" };
export const instant = false;

export default async function AdminUsersPage({
  searchParams,
}: PageProps<"/admin/users">) {
  const scope = await getAdminScope();
  if (!scope) return null;
  if (scope.type !== "SUPER") redirect("/admin");

  const { error } = await searchParams;
  const [users, countries] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        country: { select: { name: true, code: true } },
        _count: {
          select: {
            appointments: true,
            reviews: true,
          },
        },
      },
    }),
    db.country.findMany({ orderBy: { name: "asc" } }),
  ]);

  /** Country select shown in the user forms (admins get an assigned country). */
  function countryField(defaultCountryId?: string | null) {
    return (
      <Field
        label="Assigned country (admins)"
        hint="Country admins see ONLY this country's panel. Leave empty for a super admin."
      >
        <select
          name="assignedCountryId"
          defaultValue={defaultCountryId ?? ""}
          className={inputClass}
        >
          <option value="">— Super admin (all countries) —</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        subtitle="All accounts — admins manage data, doctors treat patients, patients book appointments."
      >
        <EntityDialog title="Add User" action={saveUser} trigger="＋ Add User">
          <FieldRow>
            <Field label="Full name">
              <input name="name" required className={inputClass} placeholder="Ali Raza" />
            </Field>
            <Field label="Email">
              <input
                name="email"
                type="email"
                required
                className={inputClass}
                placeholder="ali@example.com"
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Role">
              <select name="role" defaultValue="PATIENT" className={inputClass}>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Password" hint="At least 8 characters">
              <input
                name="password"
                type="password"
                required
                minLength={8}
                className={inputClass}
              />
            </Field>
          </FieldRow>
          {countryField()}
          <Field label="Phone" hint="Optional">
            <input name="phone" className={inputClass} placeholder="+92 300 0000000" />
          </Field>
        </EntityDialog>
      </PageHeader>

      <ErrorBanner message={error} />

      <Table head={["User", "Role", "Scope", "Activity", "Joined", "Actions"]}>
        {users.map((user) => (
          <tr key={user.id} className="text-slate-700">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{user.name}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
              {user.phone && <p className="text-xs text-slate-400">📞 {user.phone}</p>}
            </td>
            <td className="px-4 py-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  user.role === "ADMIN"
                    ? "bg-violet-100 text-violet-700"
                    : user.role === "DOCTOR"
                      ? "bg-sky-100 text-sky-700"
                      : "bg-teal-100 text-teal-700"
                }`}
              >
                {user.role}
              </span>
            </td>
            <td className="px-4 py-3 text-xs">
              {user.role === "ADMIN" ? (
                user.country ? (
                  <span className="rounded-full bg-teal-600 px-2.5 py-0.5 font-semibold text-white">
                    {user.country.name} panel
                  </span>
                ) : (
                  <span className="font-medium text-violet-700">Global (super)</span>
                )
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">
              {user.role === "PATIENT" && `${user._count.appointments} appointment(s) · ${user._count.reviews} review(s)`}
              {user.role === "DOCTOR" && "Doctor profile"}
              {user.role === "ADMIN" && (user.country ? "Own country only" : "Full access")}
            </td>
            <td className="px-4 py-3 text-xs">{formatDate(user.createdAt)}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <EntityDialog title={`Edit ${user.name}`} action={saveUser} openLabel="Edit">
                  <input type="hidden" name="id" value={user.id} />
                  <FieldRow>
                    <Field label="Full name">
                      <input name="name" required defaultValue={user.name} className={inputClass} />
                    </Field>
                    <Field label="Email">
                      <input
                        name="email"
                        type="email"
                        required
                        defaultValue={user.email}
                        className={inputClass}
                      />
                    </Field>
                  </FieldRow>
                  <FieldRow>
                    <Field label="Role">
                      <select name="role" defaultValue={user.role} className={inputClass}>
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="New password" hint="Leave empty to keep current">
                      <input
                        name="password"
                        type="password"
                        minLength={8}
                        className={inputClass}
                      />
                    </Field>
                  </FieldRow>
                  {countryField(user.countryId)}
                  <Field label="Phone">
                    <input name="phone" defaultValue={user.phone ?? ""} className={inputClass} />
                  </Field>
                </EntityDialog>
                <DeleteButton
                  action={deleteUser}
                  id={user.id}
                  confirmMessage={`Delete ${user.name}? Their appointments and reviews will be removed.`}
                />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}
