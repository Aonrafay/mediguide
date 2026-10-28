"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession, requireRole, setSessionCookie, signSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { APPOINTMENT_MODES, APPOINTMENT_STATUSES } from "@/lib/constants";

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

  // Remove slots already booked (any mode occupies its own slot key)
  const dayEnd = new Date(date.getTime() + 24 * 60 * 60 * 1000);
  const booked = await db.appointment.findMany({
    where: {
      doctorId,
      date: { gte: date, lt: dayEnd },
      mode,
      status: { not: "CANCELLED" },
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
    }
  }
  revalidatePath("/account");
  redirect("/account");
}

/* -------------------------- admin status control -------------------------- */

export async function updateAppointmentStatus(formData: FormData) {
  await requireRole("ADMIN");
  const id = str(formData, "id");
  const status = str(formData, "status");

  if (APPOINTMENT_STATUSES.includes(status as "PENDING")) {
    const appointment = await db.appointment.findUnique({ where: { id } });
    if (appointment) {
      await db.appointment.update({
        where: { id },
        data: {
          status,
          // Ensure video appointments always have a join link once confirmed
          ...(status === "CONFIRMED" &&
          appointment.mode === "VIDEO" &&
          !appointment.meetingLink
            ? { meetingLink: `https://meet.jit.si/mediguide-${appointment.id}` }
            : {}),
        },
      });
    }
  }
  revalidatePath("/admin/appointments");
  redirect("/admin/appointments");
}
