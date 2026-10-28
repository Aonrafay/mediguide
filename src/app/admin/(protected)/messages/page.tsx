import { DeleteButton } from "@/components/admin/ui";
import { PageHeader, Table } from "@/components/admin/table";
import {
  deleteMessage,
  markMessageRead,
  markMessageUnread,
} from "@/lib/actions/contact";
import { db } from "@/lib/db";

export const metadata = { title: "Contact Inbox" };
export const instant = false;

export default async function AdminMessagesPage() {
  const messages = await db.contactMessage.findMany({
    orderBy: [{ isRead: "asc" }, { createdAt: "desc" }],
  });
  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Inbox"
        subtitle={`Messages from the public contact form — ${unread} unread.`}
      />

      <Table head={["From", "Subject", "Message", "Received", "Actions"]}>
        {messages.map((message) => (
          <tr
            key={message.id}
            className={message.isRead ? "text-slate-700" : "bg-teal-50/50 font-medium"}
          >
            <td className="px-4 py-3">
              <p className={message.isRead ? "" : "font-semibold text-slate-900"}>
                {message.name}
              </p>
              <p className="text-xs text-slate-400">{message.email}</p>
              {message.phone && (
                <p className="text-xs text-slate-400">📞 {message.phone}</p>
              )}
            </td>
            <td className="px-4 py-3">
              {!message.isRead && <span className="me-1 text-teal-600">●</span>}
              {message.subject}
            </td>
            <td className="max-w-sm px-4 py-3 text-sm">
              <span className="line-clamp-2 text-slate-600">{message.message}</span>
            </td>
            <td className="px-4 py-3 text-xs text-slate-500">
              {new Date(message.createdAt).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-2 text-xs">
                {message.isRead ? (
                  <form action={markMessageUnread}>
                    <input type="hidden" name="id" value={message.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 font-medium text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-50"
                    >
                      Mark unread
                    </button>
                  </form>
                ) : (
                  <form action={markMessageRead}>
                    <input type="hidden" name="id" value={message.id} />
                    <button
                      type="submit"
                      className="rounded-lg px-2.5 py-1 font-medium text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
                    >
                      Mark read
                    </button>
                  </form>
                )}
                <a
                  href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
                  className="rounded-lg px-2.5 py-1 font-medium text-sky-700 ring-1 ring-sky-200 transition hover:bg-sky-50"
                >
                  Reply ↗
                </a>
                <DeleteButton
                  action={deleteMessage}
                  id={message.id}
                  confirmMessage="Delete this message?"
                />
              </div>
            </td>
          </tr>
        ))}
        {messages.length === 0 && (
          <tr>
            <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
              No contact messages yet — they will appear here when someone fills the
              form on /contact.
            </td>
          </tr>
        )}
      </Table>
    </div>
  );
}
