import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { getAdminScope } from "@/lib/adminScope";
import { normalizeTheme, THEME_COOKIE, type Theme } from "@/lib/theme";

import AdminNav, { type AdminNavItem } from "./AdminNav";
import ThemeToggle from "@/components/patient/ThemeToggle";

// Admin area reads the session on every request — allow blocking renders.
export const instant = false;

const ALL_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/countries", label: "Countries", icon: "🌍" },
  { href: "/admin/cities", label: "Cities", icon: "🏙️" },
  { href: "/admin/facility-types", label: "Facility Types", icon: "🏥" },
  { href: "/admin/facilities", label: "Facilities", icon: "🏢" },
  { href: "/admin/specialties", label: "Specialties", icon: "🩺" },
  { href: "/admin/doctors", label: "Doctors", icon: "👨‍⚕️" },
  { href: "/admin/appointments", label: "Appointments", icon: "📅" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/messages", label: "Contact Inbox", icon: "📨" },
  { href: "/admin/blog", label: "Blog", icon: "📰" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/languages", label: "Languages", icon: "🌐" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

const COUNTRY_ITEMS: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/cities", label: "Cities", icon: "🏙️" },
  { href: "/admin/facilities", label: "Facilities", icon: "🏢" },
  { href: "/admin/doctors", label: "Doctors", icon: "👨‍⚕️" },
  { href: "/admin/appointments", label: "Appointments", icon: "📅" },
  { href: "/admin/reviews", label: "Reviews", icon: "⭐" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/");

  const scope = await getAdminScope();
  if (!scope) redirect("/");

  // Global sections are super-admin only — country admins get a focused panel
  const isCountryAdmin = scope.type === "COUNTRY";

  const cookieStore = await cookies();
  const theme: Theme = normalizeTheme(cookieStore.get(THEME_COOKIE)?.value);

  const items = isCountryAdmin ? COUNTRY_ITEMS : ALL_ITEMS;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
          <span className="text-2xl">🏥</span>
          <div>
            <p className="font-bold leading-tight">MediGuide</p>
            <p className="text-xs text-slate-500">
              {isCountryAdmin ? "Country Panel" : "Super Admin"}
            </p>
          </div>
        </div>

        {/* Country scope badge */}
        {isCountryAdmin && (
          <div className="mx-3 mt-3 rounded-xl bg-teal-50 px-3 py-2.5 text-center">
            <p className="text-xs font-medium text-teal-600">Managing</p>
            <p className="font-bold text-teal-800">{scope.countryName}</p>
          </div>
        )}

        <AdminNav items={items} />
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <p className="text-sm text-slate-500">
            Signed in as{" "}
            <span className="font-semibold text-slate-800">{session.name}</span>
            {isCountryAdmin && (
              <span className="ms-2 rounded-full bg-teal-600 px-2.5 py-0.5 text-xs font-bold text-white">
                {scope.countryName} panel
              </span>
            )}
          </p>
          <div className="flex items-center gap-3">
            <ThemeToggle initial={theme} />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
