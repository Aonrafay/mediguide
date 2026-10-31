import Link from "next/link";
import { redirect } from "next/navigation";

import { logout } from "@/lib/actions/auth";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { unreadNotificationCount } from "@/lib/notifications";

// Department portal reads the session on every request.
export const instant = false;

export default async function DepartmentLayout({
  children,
}: LayoutProps<"/department">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/department");
  if (session.role !== "DEPARTMENT") redirect("/");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      facility: {
        include: {
          type: true,
          city: { include: { country: true } },
        },
      },
    },
  });
  if (!user?.facility) redirect("/");

  const unread = await unreadNotificationCount(session.userId);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-4">
          <span className="text-2xl">{user.facility.type.icon ?? "🏥"}</span>
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">
              {user.facility.name}
            </p>
            <p className="text-xs text-slate-500">
              {user.facility.type.name} · {user.facility.city.name}
            </p>
          </div>
        </div>

        <div className="mx-3 mt-3 rounded-xl bg-teal-50 px-3 py-2.5 text-center">
          <p className="text-xs font-medium text-teal-600">Department Portal</p>
          <p className="font-bold text-teal-800">{user.facility.type.name}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          <Link
            href="/department"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            📋 Booking Requests
          </Link>
          <Link
            href="/department/history"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            🗂️ Decisions History
          </Link>
          <Link
            href="/account/notifications"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            🔔 Notifications
            {unread > 0 && (
              <span className="ms-auto rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
        </nav>
      </aside>

      {/* Main area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <p className="text-sm text-slate-500">
            {user.facility.type.icon}{" "}
            <span className="font-semibold text-slate-800">{user.facility.name}</span>
            <span className="ms-2 rounded-full bg-sky-600 px-2.5 py-0.5 text-xs font-bold text-white">
              Department
            </span>
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
