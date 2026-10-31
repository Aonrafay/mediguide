import { clsx, type ClassValue } from "clsx";

/** Merge conditional class names. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format a fee like 1500 -> "Rs 1,500" (placeholder currency for now). */
export function formatFee(amount: number | null | undefined) {
  if (amount == null) return "—";
  return `Rs ${amount.toLocaleString("en-US")}`;
}

/** Human friendly date: Oct 28, 2026 */
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** UTC-safe date formatting for stored appointment dates. */
export function formatDateUTC(date: Date | string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Appointment/booking status badge color classes. */
export const statusColors: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-violet-100 text-violet-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-sky-100 text-sky-700",
  RETURNED: "bg-rose-100 text-rose-700",
  CANCELLED: "bg-slate-200 text-slate-600",
};
