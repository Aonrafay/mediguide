"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { notifyAdmins } from "@/lib/notifications";
import { db } from "@/lib/db";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export type ContactState = { error?: string; success?: string };

/** Public contact form — saves the message and pings admins. */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const phone = str(formData, "phone");
  const subject = str(formData, "subject");
  const message = str(formData, "message");

  if (!name || !email || !subject || !message) {
    return { error: "Please fill in all required fields." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return { error: "Message should be at least 10 characters." };
  }

  try {
    await db.contactMessage.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
      },
    });
  } catch {
    return { error: "Could not send your message — please try again." };
  }

  await notifyAdmins(
    "New contact message",
    `${name} (${email}) wrote: "${subject}"`
  );

  revalidatePath("/admin/messages");
  return { success: "✅ Message sent! Our team will reply within 1–2 working days." };
}

/* ------------------------- admin inbox actions ---------------------------- */

function run(path: string, mutate: () => Promise<unknown>) {
  return (async () => {
    try {
      await mutate();
    } catch {
      // inbox actions are non-critical; ignore driver errors
    }
    revalidatePath(path);
    redirect(path);
  })();
}

export async function markMessageRead(formData: FormData) {
  await import("@/lib/auth").then(({ requireRole }) => requireRole("ADMIN"));
  const id = str(formData, "id");
  await run("/admin/messages", () =>
    db.contactMessage.update({ where: { id }, data: { isRead: true } })
  );
}

export async function markMessageUnread(formData: FormData) {
  await import("@/lib/auth").then(({ requireRole }) => requireRole("ADMIN"));
  const id = str(formData, "id");
  await run("/admin/messages", () =>
    db.contactMessage.update({ where: { id }, data: { isRead: false } })
  );
}

export async function deleteMessage(formData: FormData) {
  await import("@/lib/auth").then(({ requireRole }) => requireRole("ADMIN"));
  const id = str(formData, "id");
  await run("/admin/messages", () => db.contactMessage.delete({ where: { id } }));
}
