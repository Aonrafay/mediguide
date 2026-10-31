import ChangePasswordForm from "./ChangePasswordForm";
import { PageHeader } from "@/components/admin/table";
import { getSession } from "@/lib/auth";
import { getAdminScope } from "@/lib/adminScope";
import { db } from "@/lib/db";

export const metadata = { title: "Settings" };
export const instant = false;

export default async function AdminSettingsPage() {
  const session = await getSession();
  const scope = await getAdminScope();
  if (!scope) return null;
  const isSuper = scope.type === "SUPER";

  const [counts, languageCount] = isSuper
    ? await Promise.all([
        Promise.all([
          db.country.count(),
          db.city.count(),
          db.facility.count(),
          db.doctor.count(),
          db.user.count(),
        ]),
        db.language.count(),
      ])
    : [[], 0];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        subtitle="Account security and platform overview."
      />

      {/* Account security */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">Change admin password</h2>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {session?.email}. Use at least 8 characters.
        </p>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>

      {/* Platform overview — super admin only */}
      {isSuper && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold text-slate-900">Platform overview</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 text-center">
            {[
              { label: "Countries", value: counts[0] },
              { label: "Cities", value: counts[1] },
              { label: "Facilities", value: counts[2] },
              { label: "Doctors", value: counts[3] },
              { label: "Users", value: counts[4] },
              { label: "Languages", value: languageCount },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-bold text-slate-900">About MediGuide</h2>
        <p className="mt-2 text-sm text-slate-600">
          MediGuide — Final Year Project. A global healthcare directory with
          hierarchical location browsing (Country → City → Facility Type →
          Facility → Doctor), dual-mode appointment booking (in-person + video via
          Jitsi), moderated reviews, and multi-language support with RTL.
        </p>
        <ul className="mt-3 space-y-1 text-sm text-slate-500">
          <li>⚙️ Stack: Next.js 16 · Prisma 7 · SQLite (dev) · Tailwind CSS 4</li>
          <li>🔐 Auth: JWT session cookies (jose) + bcrypt password hashing</li>
          <li>🎥 Video: Jitsi Meet links generated per confirmed video appointment</li>
        </ul>
      </section>
    </div>
  );
}
