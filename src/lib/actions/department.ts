"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { notify, notifyAdmins } from "@/lib/notifications";
import { formatDateUTC } from "@/lib/utils";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

/**
 * Shared resolver for department actions:
 * verifies the signed-in DEPARTMENT user owns the appointment's facility.
 * Returns the resolved objects; the caller redirects on failure paths.
 */
async function resolveDepartmentAppointment(appointmentId: string) {
  const session = await requireRole("DEPARTMENT");
  if (!session) redirect("/login?next=/department");

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: {
      name: true,
      facilityId: true,
      facility: { select: { name: true, typeId: true } },
    },
  });
  if (!user?.facilityId) redirect("/");

  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      doctor: { select: { name: true } },
      patient: { select: { name: true } },
    },
  });

  if (!appointment) {
    redirect("/department?error=" + encodeURIComponent("Appointment not found."));
  }
  if (appointment.facilityId !== user.facilityId) {
    redirect(
      "/department?error=" +
        encodeURIComponent("This appointment does not belong to your facility.")
    );
  }
  return { user, appointment };
}

/** Department: CONFIRM an admin-approved booking. */
export async function departmentConfirm(formData: FormData) {
  const id = str(formData, "id");
  const { user, appointment } = await resolveDepartmentAppointment(id);
  const note = str(formData, "note");

  if (appointment.status !== "APPROVED") {
    redirect(
      "/department?error=" +
        encodeURIComponent("Only bookings sent by MediGuide admin can be confirmed.")
    );
  }

  await db.appointment.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      departmentNote: note || "Confirmed by the facility.",
      departmentDecidedAt: new Date(),
      // Video link activates on confirmation
      ...(appointment.mode === "VIDEO" && !appointment.meetingLink
        ? { meetingLink: `https://meet.jit.si/mediguide-${appointment.id}` }
        : {}),
    },
  });

  const when = `${formatDateUTC(appointment.date)} at ${appointment.timeSlot}`;
  await notify(
    appointment.patientId,
    "Appointment confirmed 🎉",
    `${note ? note + " — " : ""}Your appointment with ${appointment.doctor.name} on ${when} is confirmed.`
  );
  await notifyAdmins(
    "Department confirmed a booking",
    `${user.facility?.name} confirmed ${appointment.patient.name}'s appointment with ${appointment.doctor.name} (${when}).`
  );

  revalidatePath("/department");
  redirect("/department");
}

/** Department: REJECT — returns the booking to the admin queue. */
export async function departmentReject(formData: FormData) {
  const id = str(formData, "id");
  const { user, appointment } = await resolveDepartmentAppointment(id);
  const reason = str(formData, "reason");

  if (appointment.status !== "APPROVED") {
    redirect(
      "/department?error=" +
        encodeURIComponent("Only bookings sent by MediGuide admin can be rejected.")
    );
  }
  if (!reason) {
    redirect(
      "/department?error=" +
        encodeURIComponent("Please write a short reason for the rejection.")
    );
  }

  await db.appointment.update({
    where: { id },
    data: {
      status: "RETURNED",
      departmentNote: reason,
      departmentDecidedAt: new Date(),
    },
  });

  const when = `${formatDateUTC(appointment.date)} at ${appointment.timeSlot}`;
  await notifyAdmins(
    "Department returned a booking ⬅️",
    `${user.facility?.name} returned ${appointment.patient.name}'s booking (${when}). Reason: ${reason}`
  );
  await notify(
    appointment.patientId,
    "Facility could not accept — being rearranged",
    `${user.facility?.name} could not accept your appointment with ${appointment.doctor.name} on ${when}. MediGuide is arranging an alternative.`
  );

  revalidatePath("/department");
  redirect("/department");
}
