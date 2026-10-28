import "server-only";

import { db } from "@/lib/db";

/** Create a notification for a user. Never throws — best effort only. */
export async function notify(userId: string, title: string, message: string) {
  try {
    await db.notification.create({ data: { userId, title, message } });
  } catch {
    // Notifications must never break the primary flow (booking, status…)
  }
}

/** Notify every admin account (small count, fine to loop). */
export async function notifyAdmins(title: string, message: string) {
  try {
    const admins = await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    for (const admin of admins) {
      await db.notification.create({
        data: { userId: admin.id, title, message },
      });
    }
  } catch {
    // best effort
  }
}

export async function unreadNotificationCount(userId: string) {
  return db.notification.count({ where: { userId, isRead: false } });
}
