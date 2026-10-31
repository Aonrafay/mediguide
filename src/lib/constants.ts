/**
 * Domain constants. The database stores these as strings (SQLite has no
 * enums), so application code always uses these values — validated by zod.
 */

export const ROLES = ["ADMIN", "DEPARTMENT", "DOCTOR", "PATIENT"] as const;
export type Role = (typeof ROLES)[number];

export const APPOINTMENT_MODES = ["IN_PERSON", "VIDEO"] as const;
export type AppointmentMode = (typeof APPOINTMENT_MODES)[number];

export const AVAILABILITY_MODES = ["IN_PERSON", "VIDEO", "BOTH"] as const;
export type AvailabilityMode = (typeof AVAILABILITY_MODES)[number];

/**
 * Approval-chain statuses:
 * PENDING    → patient just booked (awaiting MediGuide admin)
 * APPROVED   → admin vetted it, sent to the facility/department
 * CONFIRMED  → department confirmed the slot
 * COMPLETED  → visit happened
 * RETURNED   → department rejected; back in admin's queue
 * CANCELLED  → dropped
 */
export const APPOINTMENT_STATUSES = [
  "PENDING",
  "APPROVED",
  "CONFIRMED",
  "COMPLETED",
  "RETURNED",
  "CANCELLED",
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const GENDERS = ["MALE", "FEMALE"] as const;
export type Gender = (typeof GENDERS)[number];

/** Weekday labels matching the 0–6 JS Date.getDay() order. */
export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Sent to Department",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  RETURNED: "Returned by Department",
  CANCELLED: "Cancelled",
};

/** Statuses that hold a doctor's slot (slot engine + conflict checks). */
export const SLOT_HOLDING_STATUSES: AppointmentStatus[] = [
  "PENDING",
  "APPROVED",
  "CONFIRMED",
];

export const APPOINTMENT_MODE_LABELS: Record<AppointmentMode, string> = {
  IN_PERSON: "In-Person Visit",
  VIDEO: "Video Consultation",
};

export const AVAILABILITY_MODE_LABELS: Record<AvailabilityMode, string> = {
  IN_PERSON: "In-Person only",
  VIDEO: "Video only",
  BOTH: "In-Person & Video",
};
