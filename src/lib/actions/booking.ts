"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, requireRole, setSessionCookie, signSession } from "@/lib/auth";
import { appointmentInScope, type AdminScope } from "@/lib/adminScope";
import { getEffectiveScope } from "@/lib/adminContext";
import { db } from "@/lib/db";
import { notify, notifyAdmins } from "@/lib/notifications";
import {
  APPOINTMENT_MODES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  SLOT_HOLDING_STATUSES,
} from "@/lib/constants";
import { formatDateUTC } from "@/lib/utils";

/* ------------------------------- helpers -------------------------------- */

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function friendlyError(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  if (code === "P2002") return "That slot was just booked — please pick another.";
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** UTC midnight of the given YYYY-MM-DD string. */
function utcDate(dateStr: string) {
  return new Date(`${dateStr}T00:00:00Z`);
}

/** UTC midnight of "today". */
function todayUtc() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

/* ---------------------------- registration ------------------------------- */

export type RegisterState = { error?: string };

export async function register(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = str(formData, "redirectTo");

  if (!name || !email || !password) {
    return { error: "All fields are required." };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists — try signing in." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, email, passwordHash, role: "PATIENT" },
  });

  const token = await signSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: "PATIENT",
  });
  await setSessionCookie(token);

  redirect(redirectTo || "/account");
}

/* -------------------------------- slots ---------------------------------- */

/**
 * Bookable slots for a doctor on a date+mode. Shared logic with the
 * /api/slots route — also re-checked inside bookAppointment to prevent
 * double-booking races.
 */
export async function availableSlots(doctorId: string, dateStr: string, mode: string) {
  const date = utcDate(dateStr);
  if (Number.isNaN(date.getTime())) return [];

  const [y, m, d] = dateStr.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1)).getUTCDay();

  const windows = await db.availability.findMany({
    where: {
      doctorId,
      dayOfWeek: weekday,
      isActive: true,
      OR:
        mode === "IN_PERSON"
          ? [{ mode: "IN_PERSON" }, { mode: "BOTH" }]
          : [{ mode: "VIDEO" }, { mode: "BOTH" }],
    },
  });

  const { generateSlots } = await import("@/lib/slots");
  const slots = windows.flatMap((w) =>
    generateSlots(w.startTime, w.endTime, w.slotDurationMin)
  );

  // Remove slots already booked or held (PENDING / APPROVED / CONFIRMED)
  const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const booked = await db.appointment.findMany({
    where: {
      doctorId,
      date: { gte: date, lt: dayEnd },
      mode,
      status: { in: SLOT_HOLDING_STATUSES },
    },
    select: { timeSlot: true },
  });
  const bookedSet = new Set(booked.map((b) => b.timeSlot));

  // Hide slots that already passed today
  const now = new Date();
  const isToday =
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth() &&
    date.getUTCDate() === now.getUTCDate();

  return slots.filter((slot) => {
    if (bookedSet.has(slot)) return false;
    if (isToday) {
      const [h, min] = slot.split(":").map(Number);
      const slotTime = new Date(date);
      slotTime.setUTCHours(h, min, 0, 0);
      if (slotTime.getTime() <= now.getTime()) return false;
    }
    return true;
  });
}

/* ------------------------------- booking --------------------------------- */

export async function bookAppointment(formData: FormData) {
  const doctorId = str(formData, "doctorId");
  const dateStr = str(formData, "date");
  const timeSlot = str(formData, "timeSlot");
  const mode = str(formData, "mode");
  const notes = str(formData, "notes");

  const bookPath = `/book/${doctorId}`;

  const fail = (message: string) => {
    redirect(
      `${bookPath}?error=${encodeURIComponent(message)}&date=${dateStr}&mode=${mode}`
    );
  };

  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(bookPath)}`);
  if (session.role !== "PATIENT")
    return fail("Only patient accounts can book appointments.");

  if (!APPOINTMENT_MODES.includes(mode as "IN_PERSON")) return fail("Invalid mode.");
  if (!dateStr || !timeSlot) return fail("Pick a date and a time slot.");

  const doctor = await db.doctor.findUnique({ where: { id: doctorId } });
  if (!doctor || !doctor.isActive) return fail("Doctor not found.");
  if (mode === "VIDEO" && !doctor.offersVideo)
    return fail("This doctor does not offer video consultations.");

  // Slot must still be free
  const free = await availableSlots(doctorId, dateStr, mode);
  if (!free.includes(timeSlot)) return fail("That slot is no longer available.");

  const date = utcDate(dateStr);
  if (date < todayUtc()) return fail("Please pick a date in the future.");

  let appointmentId: string;
  try {
    const appointment = await db.appointment.create({
      data: {
        patientId: session.userId,
        doctorId,
        facilityId: doctor.facilityId,
        date,
        timeSlot,
        mode,
        notes: notes || null,
      },
    });
    appointmentId = appointment.id;

    if (mode === "VIDEO") {
      await db.appointment.update({
        where: { id: appointmentId },
        data: { meetingLink: `https://meet.jit.si/mediguide-${appointmentId}` },
      });
    }

    // Notifications (best effort)
    const when = `${formatDateUTC(date)} at ${timeSlot}`;
    await notify(
      session.userId,
      "Appointment booked 🎉",
      `Your ${mode === "VIDEO" ? "video consultation" : "in-person visit"} with ${doctor.name} is booked for ${when}.`
    );
    await notifyAdmins(
      "New appointment booked",
      `${session.name} booked ${doctor.name} (${mode === "VIDEO" ? "video" : "in-person"}) for ${when}.`
    );
  } catch (caught) {
    return fail(friendlyError(caught));
  }
  revalidatePath("/account");
  redirect(`/account?booked=1&appt=${appointmentId}`);
}

export async function cancelAppointment(formData: FormData) {
  const session = await requireRole("PATIENT");
  const id = str(formData, "id");

  const appointment = await db.appointment.findUnique({ where: { id } });
  if (appointment && appointment.patientId === session.userId) {
    if (
      appointment.status === "PENDING" ||
      appointment.status === "CONFIRMED"
    ) {
      await db.appointment.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      // Notify admins (best effort)
      const doctor = await db.doctor.findUnique({
        where: { id: appointment.doctorId },
        select: { name: true },
      });
      const patient = await db.user.findUnique({
        where: { id: session.userId },
        select: { name: true },
      });
      await notifyAdmins(
        "Appointment cancelled",
        `${patient?.name ?? "A patient"} cancelled the appointment with ${doctor?.name ?? "the doctor"} on ${formatDateUTC(appointment.date)} at ${appointment.timeSlot}.`
      );
    }
  }
  revalidatePath("/account");
  redirect("/account");
}

/* ------------------------- approval chain (admin) ------------------------- */

export async function updateAppointmentStatus(formData: FormData) {
  // Effective scope: country admins & super-in-country act as that country;
  // super-in-global (no panel open) passes as SUPER.
  const scope: AdminScope | null = await getEffectiveScope();
  if (!scope) redirect("/admin/login");
  const id = str(formData, "id");
  const action = str(formData, "action"); // approve | cancel

  const fail = (message: string) => {
    redirect("/admin/appointments?error=" + encodeURIComponent(message));
  };

  const appointment = await db.appointment.findUnique({
    where: { id },
    include: {
      doctor: { select: { name: true } },
      patient: { select: { name: true } },
    },
  });
  if (!appointment) return fail("Appointment not found.");

  // Country panel may only touch bookings inside its country
  if (scope.type === "COUNTRY" && !(await appointmentInScope(scope, id))) {
    return fail("This appointment belongs to another country.");
  }

  /* ---- Admin: APPROVE & send to department ---- */
  if (action === "approve") {
    if (appointment.status !== "PENDING" && appointment.status !== "RETURNED") {
      return fail("Only pending or returned bookings can be approved.");
    }
    const now = new Date();
    await db.appointment.update({
      where: { id },
      data: {
        status: "APPROVED",
        approvedByAdminId: scope.type === "COUNTRY" ? scope.countryId : scope.type === "SUPER" ? "SUPER" : null,
        approvedAt: now,
        sentToDepartmentAt: now,
        departmentNote: null, // clear previous rejection reason on resend
        departmentDecidedAt: null,
        // Re-generate video link if a video appointment being (re)sent
        ...(appointment.mode === "VIDEO" && !appointment.meetingLink
          ? { meetingLink: `https://meet.jit.si/mediguide-${appointment.id}` }
          : {}),
      },
    });

    const when = `${formatDateUTC(appointment.date)} at ${appointment.timeSlot}`;
    await notify(
      appointment.patientId,
      "Booking approved ✅",
      `Your appointment with ${appointment.doctor.name} on ${when} was approved and sent to the facility for final confirmation.`
    );
    // Notify all department users of that facility
    const deptUsers = await db.user.findMany({
      where: { role: "DEPARTMENT", facilityId: appointment.facilityId },
      select: { id: true },
    });
    for (const user of deptUsers) {
      await notify(
        user.id,
        "New booking sent to your facility 📨",
        `${appointment.patient.name} — ${appointment.doctor.name}, ${when} (${appointment.mode === "VIDEO" ? "video" : "in-person"}). Please confirm.`
      );
    }
    revalidatePath("/admin/appointments");
    redirect("/admin/appointments");
  }

  /* ---- Admin: CANCEL ---- */
  if (action === "cancel") {
    if (
      appointment.status === "COMPLETED" ||
      appointment.status === "CANCELLED"
    ) {
      return fail("This appointment is already closed.");
    }
    await db.appointment.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await notify(
      appointment.patientId,
      "Appointment cancelled",
      `Your appointment with ${appointment.doctor.name} on ${formatDateUTC(appointment.date)} at ${appointment.timeSlot} was cancelled by MediGuide.`
    );
    revalidatePath("/admin/appointments");
    redirect("/admin/appointments");
  }

  /* ---- Admin: COMPLETE (kept for direct completion) ---- */
  if (action === "complete") {
    if (appointment.status !== "CONFIRMED") {
      return fail("Only confirmed appointments can be completed.");
    }
    await db.appointment.update({
      where: { id },
      data: { status: "COMPLETED" },
    });
    await notify(
      appointment.patientId,
      "Visit completed — leave a review! ⭐",
      `Your visit with ${appointment.doctor.name} on ${formatDateUTC(appointment.date)} is marked completed.`
    );
    revalidatePath("/admin/appointments");
    redirect("/admin/appointments");
  }

  return fail("Unknown action.");
}
