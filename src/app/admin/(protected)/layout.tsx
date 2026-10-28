import { redirect } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";

import AdminNav from "./AdminNav";

// Admin area reads the session on every request — allow blocking renders.
export const instant = false;

export default async function AdminLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=/admin");
  if (session.role !== "ADMIN") redirect("/");

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
          <span className="text-2xl">🏥</span>
          <div>
            <p className="font-bold leading-tight">MediGuide</p>
            <p className="text-xs text-slate-500">Admin Panel</p>
          </div>
        </div>
        <AdminNav />
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <p className="text-sm text-slate-500">
            Signed in as{" "}
            <span className="font-semibold text-slate-800">{session.name}</span>
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Sign out
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">{children}</main>
      </div>
    </div>
  );
}
