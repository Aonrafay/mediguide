import Link from "next/link";
import { redirect } from "next/navigation";

import { markAllNotificationsRead } from "@/lib/actions/engagement";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Notifications" };
export const instant = false;

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/notifications");

  const notifications = await db.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <nav className="text-sm text-slate-500">
        <Link href="/account" className="hover:text-teal-700">
          ← My Appointments
        </Link>
      </nav>

      <header className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-slate-500">
            {unread > 0 ? `${unread} unread` : "All caught up ✅"}
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              Mark all read
            </button>
          </form>
        )}
      </header>

      <div className="mt-6 space-y-3">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl border p-4 ${
              n.isRead
                ? "border-slate-200 bg-white"
                : "border-teal-200 bg-teal-50/60"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-slate-900">{n.title}</p>
              {!n.isRead && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
              )}
            </div>
            <p className="mt-1 text-sm text-slate-600">{n.message}</p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(n.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            No notifications yet — book an appointment to get started.
          </p>
        )}
      </div>
    </main>
  );
}
